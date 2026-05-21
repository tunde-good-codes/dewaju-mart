import { MailerService } from "@nestjs-modules/mailer";
import { Injectable, Logger } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class OtpEmailProvider {
  private readonly logger = new Logger("otp mail");

  constructor(private readonly mailService: MailerService) {}

  async sendOtpEmail(data: { email: string; otp: string }) {
    const templateDir = (this.mailService as any).options?.template?.dir;
    this.logger.log("Mailer template dir:", templateDir);

    this.logger.log(
      "Current Host Process Configured:",
      this.mailService["options"]?.transport?.host
    );
    this.logger.log(
      "Current Port Process Configured:",
      this.mailService["options"]?.transport?.port
    );
    try {
      await this.mailService.sendMail({
        to: data.email,
        template: "otp",
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
