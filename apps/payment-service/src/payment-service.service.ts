import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Payment, PaymentStatus } from "./entities/payment.entity";
import { DataSource, Repository } from "typeorm";
import { PaystackService } from "./paystack.service";
import { KAFKA_SERVICE, KAFKA_TOPICS } from "@app/kafka";
import { ClientKafka } from "@nestjs/microservices";
import { Queue } from "bullmq";
import { v4 as uuid } from "uuid";
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import { InjectQueue } from "@nestjs/bullmq";

export const VERIFY_PAYMENT_QUEUE = "verify-payment";

@Injectable()
export class PaymentService implements OnModuleInit {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,

    private readonly paystackService: PaystackService,
    @Inject(KAFKA_SERVICE)
    private readonly kafkaClient: ClientKafka,

    @InjectQueue(VERIFY_PAYMENT_QUEUE)
    private readonly verifyPaymentQueue: Queue,
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache
  ) {}

  private readonly logger = new Logger("payment-service");
  getHello(): string {
    return "Hello World!";
  }

  async onModuleInit() {
    this.kafkaClient.connect();
    this.logger.log(`kafka connected`);
  }

  async handleOrderCreated(payload: {
    orderId: string;
    buyerId: string;
    email: string;
    totalAmount: number;
  }) {
    const { orderId, buyerId, email, totalAmount } = payload;

    const reference = `Dewaju_mart-${uuid()}`;

    try {
      const paystackData = await this.paystackService.initializeTransaction({
        amount: totalAmount,
        email,
        reference,
        metadata: {
          orderId,
          buyerId,
        },
      });

      const payment = await this.dataSource.transaction(async (manager) => {
        const newPayment = manager.create(Payment, {
          orderId,
          buyerId,
          buyerEmail: email,
          amount: totalAmount,
          reference,
          status: PaymentStatus.PENDING,
        });

        return manager.save(Payment, newPayment);
      });

      await this.cacheManager.set(`payment:ref:${reference}`, orderId, 600000);
      this.kafkaClient.emit(KAFKA_TOPICS.PAYMENT_INITIATED, {
        orderId,
        buyerId,
        buyerEmail: email,
        reference,
        authorizationUrl: paystackData.authorization_url,
      });
      this.logger.log(
        `Initializing payment with: ${JSON.stringify({
          amount: Math.round(totalAmount * 100),
          email,
          reference,
        })}`
      );
      this.logger.log(
        `Payment initialized successfully. Order=${orderId}, Reference=${reference}`
      );

      return {
        paymentId: payment.id,
        reference,
        authorizationUrl: paystackData.authorization_url,
      };
    } catch (error) {
      this.logger.error(
        `Failed to initialize payment for order ${orderId}`,
        error.stack
      );

      this.kafkaClient.emit(KAFKA_TOPICS.PAYMENT_FAILED, {
        orderId,
        buyerId,
      });

      throw new BadRequestException(
        error?.message ?? "Failed to initialize payment"
      );
    }
  }

  async handleWebhook(rawBody: string, signature: string) {
    const isValid = this.paystackService.verifySignature(rawBody, signature);

    if (!isValid) {
      throw new BadRequestException("Invalid webhook signature");
    }

    const event = JSON.parse(rawBody);

    this.logger.log(`Webhook received: ${event.event}`);

    if (event.event !== "charge.success") {
      return { received: true };
    }

    const { reference } = event.data;

    await this.verifyPaymentQueue.add(
      "verify",
      { reference },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 3000 },
        removeOnComplete: true,
        removeOnFail: false,
      }
    );

    this.logger.log(`Verification job queued for reference: ${reference}`);
    return { received: true };
  }

  async verifyAndConfirmPayment(reference: string) {
    const alreadyProcessed = await this.cacheManager.get(
      `payment:processed:${reference}`
    );

    if (alreadyProcessed) {
      this.logger.log(`Reference ${reference} already processed, skipping`);
      return;
    }

    const payment = await this.paymentRepository.findOne({
      where: { reference },
    });

    if (!payment) {
      this.logger.error(`Payment record not found for reference: ${reference}`);
      return;
    }

    const paystackData =
      await this.paystackService.verifyTransaction(reference);

    if (paystackData.status === "success") {
      await this.paymentRepository.update(payment.id, {
        status: PaymentStatus.SUCCESS,
        paidAt: new Date(paystackData.paid_at),
      });

      this.kafkaClient.emit(KAFKA_TOPICS.PAYMENT_CONFIRMED, {
        orderId: payment.orderId,
        reference,
        amount: payment.amount,
        buyerEmail: payment.buyerEmail,
      });

      this.logger.log(`Payment confirmed for order: ${payment.orderId}`);
    } else {
      await this.paymentRepository.update(payment.id, {
        status: PaymentStatus.FAILED,
      });

      this.kafkaClient.emit(KAFKA_TOPICS.PAYMENT_FAILED, {
        orderId: payment.orderId,
        reference,
      });

      this.logger.log(`Payment failed for order: ${payment.orderId}`);
    }

    await this.cacheManager.set(
      `payment:processed:${reference}`,
      true,
      86400000
    );
  }
}
