import { MailerService } from "@nestjs-modules/mailer";
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class PaymentFailedEmailProvider {
  private readonly logger = new Logger("payment failed mail");

  constructor(private readonly mailService: MailerService) {}

  async sendEmail(data: {
    orderId: string;
    buyerEmail: string;
    buyerId: string;
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
        to: data.buyerEmail,
        template: "payment-failed",
        subject: "Payment failed",
        context: {
          orderId: data.orderId,
          buyerId: data.buyerId,
        },
      });
      this.logger.log(
        `payment initialization mail dispatched flawlessly to ${data.buyerEmail}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to send payment initialization to ${data.buyerEmail}: ${error.message}`
      );
    }
  }
}
