import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Order, OrderStatus } from "./entities/order.entity";
import { DataSource, Not, Repository } from "typeorm";
import { KAFKA_SERVICE, KAFKA_TOPICS } from "@app/kafka";
import { ClientKafka } from "@nestjs/microservices";
import { OrderItem } from "./entities/order.item.entity";
import { CreateOrderDto } from "./dtos/create-order.dto";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { SERVICES_PORT } from "libs/shared/constants/services.constant";
import { transitionOrderStatus } from "./state.machine";

@Injectable()
export class OrderService implements OnModuleInit {
  private logger = new Logger("order-service-logic");
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,

    private readonly datasource: DataSource,
    @Inject(KAFKA_SERVICE)
    private readonly kafkaClient: ClientKafka,
    private readonly httpService: HttpService
  ) {}
  private productServiceServer = `http://localhost:${SERVICES_PORT.PRODUCT_SERVICE}/api/v1/products`;
  getHello(): string {
    return "Hello World!";
  }

  async onModuleInit() {
    await this.kafkaClient.connect();
    this.logger.log("kafka connected for order service");
  }

  async getSingleProduct(id: string) {
    const url = `${this.productServiceServer}/${id}`;

    this.logger.log(`Calling product service: ${url}`);
    try {
      const result = await firstValueFrom(this.httpService.get(url));

      if (!result) {
        throw new NotFoundException("error fetching product for this order");
      }

      return result.data;
    } catch (error) {
      throw new BadGatewayException(error.message);
    }
  }

  async createOrder(dto: CreateOrderDto, buyerId: string, buyerEmail: string) {
    const qr = this.datasource.createQueryRunner();

    await qr.connect();
    await qr.startTransaction();

    try {
      let totalAmount: number = 0;
      const orderItems = await Promise.all(
        dto.items.map(async (item) => {
          const product = await this.getSingleProduct(item.productId);

          if (!product) {
            throw new BadRequestException("Product not available");
          }

          if (product.data.stock < item.quantity) {
            throw new ConflictException("This product might be out of stock");
          }

          const subTotal = Number(product.data.price * item.quantity);
          totalAmount = Math.round((totalAmount + subTotal) * 100) / 100;
          return qr.manager.create(OrderItem, {
            productId: product.data.id,
            subTotal,
            productName: product.data.name,
            quantity: item.quantity,
            unitPrice: product.data.price,
          });
        })
      );
      const order = qr.manager.create(Order, {
        buyerEmail,
        buyerId,
        totalAmount,
        orderStatus: OrderStatus.PENDING,
      });

      const savedOrder = await qr.manager.save(Order, order);

      orderItems.map((item) => (item.orderId = savedOrder.id));

      await qr.manager.save(OrderItem, orderItems);

      await qr.commitTransaction();

      const createOrderPayload = {
        orderId: savedOrder.id,
        buyerEmail,
        buyerId,
        totalAmount,
      };

      this.kafkaClient.emit(KAFKA_TOPICS.ORDER_CREATED, createOrderPayload);

      return {
        savedOrder,
        orderItems,
      };
    } catch (error) {
      await qr.rollbackTransaction();

      this.logger.warn(`error creating a new order: ${error.message}`);
      throw new BadRequestException(error?.message);
    } finally {
      await qr.release();
    }
  }

  async getMyOrders(userId: string): Promise<Order[]> {
    const myOrders = await this.orderRepository
      .createQueryBuilder("orders")
      .where("orders.buyerId = :userId", { userId })
      .leftJoinAndSelect("orders.orderItems", "orderItems")
      .orderBy("orders.createdAt", "DESC")
      .getMany();

    if (!myOrders || myOrders.length === 0) {
      throw new NotFoundException("no order for this user");
    }

    return myOrders;
  }

  async getAllOrders() {
    const orders = await this.orderRepository.find({});

    if (!orders || orders.length === 0) {
      throw new NotFoundException("no orders found");
    }

    return { orders };
  }

  async getMyOneOrderById(userId: string, orderId: string) {
    const order = await this.orderRepository
      .createQueryBuilder("order")
      .where("order.buyerId = :userId", { userId })
      .andWhere("order.id = :orderId", { orderId })
      .leftJoinAndSelect("order.orderItems", "orderItems")
      .getOne();

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    return order;
  }

  async getOrderById(id: string) {
    const order = await this.orderRepository.findOne({
      where: {
        id,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order not found for this id!: ${id}`);
    }

    return order;
  }

  async cancelMyOrder(userId: string, orderId: string) {
    const order = await this.getMyOneOrderById(userId, orderId);

    order.orderStatus = transitionOrderStatus(
      order.orderStatus,
      OrderStatus.CANCELLED
    );

    await this.orderRepository.save(order);
    this.logger.log(`this order has been cancelled: ${userId}`);

    return "order cancelled";
  }

  async handlePaymentConfirmed(id: string) {
    const order = await this.getOrderById(id);

    order.orderStatus = transitionOrderStatus(
      order.orderStatus,
      OrderStatus.PAYMENT_CONFIRMED
    );

    await this.orderRepository.save(order);
    this.logger.log(`this payment for this order has been confirmed`);

    return "order confirmed";
  }

  async handleFailedPayment(id: string) {
    const order = await this.getOrderById(id);

    order.orderStatus = transitionOrderStatus(
      order.orderStatus,
      OrderStatus.CANCELLED
    );

    await this.orderRepository.save(order);

    this.logger.log(`the order  with this id has been deemed failed: ${id}`);

    return "order failed";
  }

  async deleteOrder(userId: string, orderId: string) {
    const order = await this.orderRepository.findOne({
      where: {
        id: orderId,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order not found`);
    }
    if (order?.buyerId !== userId) {
      throw new ForbiddenException(
        "You are not authorized to delete this order"
      );
    }

    await this.orderRepository.delete(order.id);

    return {
      message: `this order: ${order.id} has been deleted`,
    };
  }
}
