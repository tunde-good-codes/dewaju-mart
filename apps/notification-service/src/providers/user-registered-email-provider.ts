import { MailerService } from "@nestjs-modules/mailer";
import { Injectable, Logger, RequestTimeoutException } from "@nestjs/common";

@Injectable()
export class UserRegisteredProvider {
  constructor(private readonly mailerService: MailerService) {}
  private readonly logger = new Logger("user-registered");

  async send(data: { firstName: string; email: string }) {
    try {
      this.mailerService.sendMail({
        to: data.email,
        subject: `Welcome to DejuMart ${data.firstName}  `,
        template: "user-welcome",
        context: {
          firstName: data.firstName,
        },
      });
      this.logger.log("email sent successfully");
    } catch (error) {
      throw new RequestTimeoutException(error);
    }
  }
}
