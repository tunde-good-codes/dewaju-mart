import { MailerService } from "@nestjs-modules/mailer";
import { Injectable, Logger } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class PaymentConfirmedEmailProvider {
  private readonly logger = new Logger("payment confirmed mail");

  constructor(private readonly mailService: MailerService) {}

  async sendEmail(data: {
    email: string;
    orderId: string;
    reference: string;
    amount: number;
  }) {
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
        template: "payment-confirmed",
        subject: "Payment confirmed",
        context: {
          orderId: data.orderId,
          reference: data.reference,
          amount: data.amount,
        },
      });
      this.logger.log(`payment confirmation mail dispatched flawlessly to ${data.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send payment initialization to ${data.email}: ${error.message}`
      );
    }
  }
}
