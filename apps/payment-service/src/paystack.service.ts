import { HttpService } from "@nestjs/axios";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  PaystackInitializationPayload,
  PaystackInitializationResponse,
  PaystackVerificationResponse,
} from "../types";
import { firstValueFrom } from "rxjs";
import * as crypto from "crypto";
@Injectable()
export class PaystackService {
  private readonly logger = new Logger("paystack-service");
  private readonly paystackSecretKey: string;
  private readonly paystackBaseUrl: string;
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    ((this.paystackBaseUrl = configService.getOrThrow("PAYSTACK_BASE_URL")),
      (this.paystackSecretKey = configService.getOrThrow(
        "PAYSTACK_SECRET_KEY"
      )));
  }

  async initializeTransaction(
    payload: PaystackInitializationPayload
  ): Promise<PaystackInitializationResponse> {
    const { amount, email, reference, metadata } = payload;

    const amountInKobo = Math.round(amount * 100);

    const response = await firstValueFrom(
      this.httpService.post(
        `${this.paystackBaseUrl}/transaction/initialize`,
        { amount: amountInKobo, email, reference, metadata },
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`,
            "Content-Type": "application/json",
          },
        }
      )
    );
    this.logger.log(`paystack service initialized`);

    return response.data.data;
  }

  async verifyTransaction(
    reference: string
  ): Promise<PaystackVerificationResponse> {
    const response = await firstValueFrom(
      this.httpService.get(
        `${this.paystackBaseUrl}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`,
          },
        }
      )
    );

    return response.data.data;
  }

  async verifySignature(payload: string, signature: string) {
    const hash = crypto
      .createHmac("sha512", this.paystackSecretKey)
      .update(payload)
      .digest("hex");

    const isValid = hash === signature;

    if (!isValid) {
      throw new ConflictException("verification of signature failed");
    }

    return isValid;
  }
}
