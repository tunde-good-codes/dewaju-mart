// apps/notification-service/src/providers/google-welcome-email.provider.ts
import { Injectable, Logger } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";

@Injectable()
export class GoogleWelcomeEmailProvider {
  private readonly logger = new Logger(GoogleWelcomeEmailProvider.name);

  constructor(private readonly mailerService: MailerService) {}

  async send(data: {
    email: string;
    firstName: string;
    imageUrl?: string;
  }): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: "🚀 Welcome to Dewaju Mart!",
        template: "welcome-google", // Points to templates/welcome-google.ejs
        context: {
          firstName: data.firstName,
          imageUrl: data.imageUrl,
        },
      });
      this.logger.log(`Google onboarding welcome mail sent to ${data.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send Google Welcome to ${data.email}: ${error.message}`
      );
    }
  }
}
