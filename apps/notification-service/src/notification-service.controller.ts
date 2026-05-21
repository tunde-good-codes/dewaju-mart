import { Controller, Get, Logger } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";
import { NotificationService } from "./notification-service.service";
import { KAFKA_TOPICS } from "@app/kafka";

@Controller()
export class NotificationServiceController {
  constructor(private readonly notificationService: NotificationService) {}
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

  @Get()
  getHello() {
    return this.notificationService.getHello();
  }
}
