import { NotificationProvider } from "./providers/notification-provider";
import { VerifyEmailOtpProvider } from "./providers/verify-email-otp";
import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { OtpEmailProvider } from "./providers/otp-email-provider";
import { GoogleWelcomeEmailProvider } from "./providers/google-email-provider";
import { KAFKA_SERVICE } from "@app/kafka";
import { ClientKafka } from "@nestjs/microservices";
import { UserRegisteredProvider } from "./providers/user-registered-email-provider";
import { ResetPasswordProvider } from "./providers/reset-password-provider";
import { PaymentInitiatedEmailProvider } from "./providers/payment-initiated-provider";
import { PaymentConfirmedEmailProvider } from "./providers/payment-confirmed-provider";
import { OrderCreatedEmailProvider } from "./providers/order-created-provider";

@Injectable()
export class NotificationService implements OnModuleInit {
  constructor(
    private readonly otpEmailProvider: OtpEmailProvider,
    private readonly googleWelcomeEmailProvider: GoogleWelcomeEmailProvider,
    private readonly userRegistered: UserRegisteredProvider,
    private readonly resetPasswordProvider: ResetPasswordProvider,
    private readonly verifyEmailOtpProvider: VerifyEmailOtpProvider,
    private readonly paymentInitiatedEmailProvider: PaymentInitiatedEmailProvider,
    private readonly paymentConfirmedEmailProvider: PaymentConfirmedEmailProvider,
    private readonly gateway: NotificationProvider,
    private readonly orderCreatedEmailProvider: OrderCreatedEmailProvider,
    @Inject(KAFKA_SERVICE)
    private readonly kafkaClient: ClientKafka
  ) {}

  async onModuleInit() {
    await this.kafkaClient.connect();
  }
  async sendOtp(payload: { email: string; otp: string }) {
    await this.otpEmailProvider.sendOtpEmail(payload);
  }

  async sendGoogleWelcome(payload: {
    email: string;
    firstName: string;
    imageUrl?: string;
  }) {
    await this.googleWelcomeEmailProvider.send(payload);
  }
  async userEmailRegister(data: { firstName: string; email: string }) {
    return this.userRegistered.send(data);
  }

  async resetPasswordOtp(data: {
    otp: string;
    email: string;
    firstName: string;
  }) {
    await this.resetPasswordProvider.sendEmail(data);
  }

  async verifyEmailOtp(data: { name: string; email: string; otp: string }) {
    await this.verifyEmailOtpProvider.sendEmail(data);
  }
  getHello() {
    return "hello";
  }

  async sendPaymentInitiatedEmail(payload: {
    orderId: string;
    reference: string;
    authorizationUrl: string;
    
    buyerEmail: string;
    buyerId: string;
  }) {
    await this.paymentInitiatedEmailProvider.sendEmail(payload);
  }
  async sendOrderCreatedEmail(payload: {
    orderId: string;
    buyerEmail: string;
    buyerId: string;
    totalAmount: string;
  }) {
    await this.orderCreatedEmailProvider.sendEmail(payload);
    this.gateway.sendToUser(payload.buyerId, "order:created", {
      message: "Your order has been placed successfully.",
      orderId: payload.orderId,
      totalAmount: payload.totalAmount,
    });
  }

  async sendPaymentConfirmedEmail(payload: {
    orderId: string;
    reference: string;
    amount: number;
    buyerEmail: string;
    buyerId: string;
  }) {
    await this.paymentConfirmedEmailProvider.sendEmail(payload);

    this.gateway.sendToUser(payload.buyerId, "payment:confirmed", {
      message: "Your payment was successful. Order is being processed.",
      orderId: payload.orderId,
      amount: payload.amount,
    });
  }
}
