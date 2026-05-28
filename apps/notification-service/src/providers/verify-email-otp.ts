import { MailerService } from "@nestjs-modules/mailer";
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class VerifyEmailOtpProvider {
  private readonly logger = new Logger("verify-email-otp");
  constructor(private readonly mailService: MailerService) {}

  async sendEmail(data: { name: string; email: string; otp: string }) {
    try {
      this.mailService.sendMail({
        to: data.email,
        subject: "Email Verification Otp",
        template: "verify-email-otp",
        context: {
          name: data.name,
          otp: data.otp,
        },
      });

      this.logger.log("email sent successfully");
    } catch (error) {
      this.logger.warn(`error sending email : ${error}`);
    }
  }
}
