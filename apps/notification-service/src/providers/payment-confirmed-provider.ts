import { MailerService } from "@nestjs-modules/mailer";
import { Injectable, Logger } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class PaymentConfirmedEmailProvider {
  private readonly logger = new Logger("payment confirmed mail");

  constructor(private readonly mailService: MailerService) {}
  async sendEmail(data: {
    orderId: string;
    reference: string;
    amount: number;
    buyerEmail: string;
    buyerId: string;
  }) {
    try {
      this.logger.log(`Attempting to send to: ${data.buyerEmail}`);
      this.logger.log(`Template: payment-confirmed`);

      await this.mailService.sendMail({
        to: data.buyerEmail,
        template: "payment-confirmed",
        subject: "Payment confirmed",
        context: {
          orderId: data.orderId,
          buyerId: data.buyerId,
          reference: data.reference,
          amount: data.amount,
        },
      });

      this.logger.log(
        `payment confirmation mail dispatched to ${data.buyerEmail}`
      );
    } catch (error) {
      // ✅ Log the full error
      this.logger.error(`Full error: ${JSON.stringify(error)}`);
      this.logger.error(`Error message: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
    }
  }
}
