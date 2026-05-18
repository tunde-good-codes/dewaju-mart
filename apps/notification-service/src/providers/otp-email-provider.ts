import { MailerService } from "@nestjs-modules/mailer";
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class OtpEmailProvider {
  private readonly logger = new Logger("otp mail");

  constructor(private readonly mailService: MailerService) {}

  async sendOtpEmail(data: { email: string; otp: string }) {
    try {
      await this.mailService.sendMail({
        to: data.email,
        template: "../templates/otp.ejs",
        subject: "Your Verification Code to Dewaju",
        context: {
          otp: data.otp,
        },
      });
      this.logger.log(`OTP mail dispatched flawlessly to ${data.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send OTP to ${data.email}: ${error.message}`
      );
    }
  }
}
