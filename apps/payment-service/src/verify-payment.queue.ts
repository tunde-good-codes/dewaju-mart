import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { PaymentService, VERIFY_PAYMENT_QUEUE } from "./payment-service.service";


@Processor(VERIFY_PAYMENT_QUEUE)
export class VerifyPaymentProcessor extends WorkerHost {
  private readonly logger = new Logger(VerifyPaymentProcessor.name);

  constructor(private readonly paymentService: PaymentService) {
    super();
  }

  async process(job: Job<{ reference: string }>) {
    this.logger.log(`Processing verification job for ref: ${job.data.reference}`);
    await this.paymentService.verifyAndConfirmPayment(job.data.reference);
  }
}