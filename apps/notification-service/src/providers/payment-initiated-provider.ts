import { MailerService } from "@nestjs-modules/mailer";
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class PaymentInitiatedEmailProvider {
  private readonly logger = new Logger("payment initiated mail");

  constructor(private readonly mailService: MailerService) {}

  async sendEmail(data: {
    orderId: string;
    reference: string;
    authorizationUrl: string;

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
        template: "payment-initiated",
        subject: "Payment Initiated",
        context: {
          orderId: data.orderId,
          reference: data.reference,
          buyerId: data.buyerId,
          authorizationUrl: data.authorizationUrl,
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
