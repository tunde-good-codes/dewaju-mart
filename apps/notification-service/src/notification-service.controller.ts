import { NotificationProvider } from "./providers/notification-provider";
import { Controller, Get, Logger, Param } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";
import { NotificationService } from "./notification-service.service";
import { KAFKA_TOPICS } from "@app/kafka";

@Controller()
export class NotificationServiceController {
  constructor(
    private readonly notificationService: NotificationService,
  private readonly   gateway: NotificationProvider
  ) {}
  logger = new Logger("notification-logs");
  @EventPattern(KAFKA_TOPICS.REGISTER_USER_OTP)
  async handleUserRegistrationInitiated(
    @Payload() data: { email: string; otp: string }
  ) {
    this.logger.log(data.email, "check email data");
    await this.notificationService.sendOtp(data);
  }

  @EventPattern(KAFKA_TOPICS.GOOGLE_USER_CREATED)
  async handleGoogleUserCreated(
    @Payload() data: { email: string; firstName: string; imageUrl?: string }
  ) {
    await this.notificationService.sendGoogleWelcome(data);
  }

  @EventPattern(KAFKA_TOPICS.USER_CREATED)
  async userEmailRegistered(
    @Payload() data: { firstName: string; email: string }
  ) {
    return this.notificationService.userEmailRegister(data);
  }

  @EventPattern(KAFKA_TOPICS.FORGOT_PASSWORD_OTP)
  async resetPassword(
    @Payload() data: { otp: string; email: string; firstName: string }
  ) {
    return this.notificationService.resetPasswordOtp(data);
  }

  @EventPattern(KAFKA_TOPICS.VERIFY_EMAIL_OTP)
  async verifyEmailOtp(
    @Payload() data: { name: string; email: string; otp: string }
  ) {
    return await this.notificationService.verifyEmailOtp(data);
  }
  @EventPattern(KAFKA_TOPICS.PAYMENT_CONFIRMED)
  async paymentVerifiedAndConfirmed(
    @Payload()
    data: {
      orderId: string;
      reference: string;
      amount: number;
      buyerEmail: string;
      buyerId: string;
    }
  ) {
    return await this.notificationService.sendPaymentConfirmedEmail(data);
  }
  @EventPattern(KAFKA_TOPICS.PAYMENT_INITIATED)
  async paymentInitiated(
    @Payload()
    data: {
      buyerEmail: string;
      buyerId: string;
      orderId: string;
      reference: string;
      authorizationUrl: string;
    }
  ) {
    return await this.notificationService.sendPaymentInitiatedEmail(data);
  }

  @EventPattern(KAFKA_TOPICS.ORDER_CREATED)
  async orderCreated(
    @Payload()
    data: {
      orderId: string;
      buyerEmail: string;
      buyerId: string;
      totalAmount: number;
    }
  ) {
    return await this.notificationService.sendOrderCreatedEmail(data);
  }

  @EventPattern(KAFKA_TOPICS.PAYMENT_FAILED)
  async paymentFailed(
    @Payload()
    data: {
      orderId: string;
      buyerId: string;
      buyerEmail: string;
    }
  ) {
    return await this.notificationService.sendPaymentFailedEmail(data);
  }

  @Get("test-ws/:userId")
  testWebSocket(@Param("userId") userId: string) {
    this.gateway.sendToUser(userId, "payment:confirmed", {
      message: "Test notification working!",
      orderId: "test-order-123",
      amount: 1000,
    });
    return { sent: true };
  }
  @Get()
  getHello() {
    return this.notificationService.getHello();
  }
}
