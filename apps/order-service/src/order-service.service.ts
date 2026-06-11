import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Order, OrderStatus } from "./entities/order.entity";
import { DataSource, Repository } from "typeorm";
import { KAFKA_SERVICE, KAFKA_TOPICS } from "@app/kafka";
import { ClientKafka } from "@nestjs/microservices";
import { OrderItem } from "./entities/order.item.entity";
import { CreateOrderDto } from "./dtos/create-order.dto";
import { ProductService } from "apps/product-service/src/product-service.service";

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

    @Inject()
    private readonly productService: ProductService
  ) {}

  getHello(): string {
    return "Hello World!";
  }

  async onModuleInit() {
    await this.kafkaClient.connect();
    this.logger.log("kafka connected for order service");
  }

  async createOrder(dto: CreateOrderDto, buyerId: string, buyerEmail: string) {
    const qr = this.datasource.createQueryRunner();

    await qr.connect();
    await qr.startTransaction();

    try {
      let totalAmount: number = 0;
      const orderItems = await Promise.all(
        dto.items.map(async (item) => {
          const product = await this.productService.getSingleProduct(
            item.productId
          );

          if (!product) {
            throw new BadRequestException("Product not available");
          }

          if (product.product.stock < item.quantity) {
            throw new ConflictException("This product might be out of stock");
          }

          const subTotal = Number(product.product.price) * item.quantity;
          totalAmount += subTotal;

          return qr.manager.create(OrderItem, {
            productId: product.product.id,
            subTotal,
            productName: product.product.name,
            quantity: item.quantity,
            unitPrice: product.product.price,
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
    } catch (error) {
      await qr.rollbackTransaction();

      this.logger.warn(`error creating a new order: ${error.message}`);
      throw new BadRequestException(error?.message);
    } finally {
      await qr.release();
    }
  }
}
