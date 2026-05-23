import { MailerService } from "@nestjs-modules/mailer";
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class ResetPasswordProvider {
  constructor(private readonly mailService: MailerService) {}
  private readonly logger = new Logger("reset-password-provider");

  async sendEmail(data: { otp: string; email: string; firstName: string }) {
    try {
      this.mailService.sendMail({
        to: data.email,
        subject: "Your Password reset Token",
        template: "reset-otp",
        context: {
          otp: data.otp,
          firstName: data.firstName,
        },
      });
      this.logger.log("reset otp has been sent");
    } catch (error) {
      this.logger.error("failure sending request otp");
    }
  }
}
