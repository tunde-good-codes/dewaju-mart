import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Order } from "./entities/order.entity";
import { DataSource, Repository } from "typeorm";
import { KAFKA_SERVICE } from "@app/kafka";
import { ClientKafka } from "@nestjs/microservices";
import { OrderItem } from "./entities/order.item.entity";

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
    private readonly kafkaClient: ClientKafka
  ) {}

  getHello(): string {
    return "Hello World!";
  }

  async onModuleInit() {
    await this.kafkaClient.connect();
    this.logger.log("kafka connected for order service");
  }

  
}
