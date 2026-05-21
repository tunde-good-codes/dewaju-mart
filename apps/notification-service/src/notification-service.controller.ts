

import { Controller, Logger } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";
import { NotificationService } from "./notification-service.service";
import { KAFKA_TOPICS } from "@app/kafka";

@Controller()
export class NotificationServiceController {
  constructor(private readonly notificationService: NotificationService) {}
logger = new Logger("notification-logs")
  @EventPattern(KAFKA_TOPICS.USER_CREATED) 
  async handleUserRegistrationInitiated(@Payload() data: { email: string; otp: string }) {
    this.logger.log(data, "check email data")
    await this.notificationService.sendOtp(data);
  }

  @EventPattern(KAFKA_TOPICS.GOOGLE_USER_CREATED) 
  async handleGoogleUserCreated(@Payload() data: { email: string; firstName: string; imageUrl?: string }) {
    await this.notificationService.sendGoogleWelcome(data);
  }
}