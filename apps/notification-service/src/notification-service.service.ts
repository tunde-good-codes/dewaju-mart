import { Injectable } from "@nestjs/common";
import { OtpEmailProvider } from "./providers/otp-email-provider";
import { GoogleWelcomeEmailProvider } from "./providers/google-email-provider";

@Injectable()
export class NotificationService {
  constructor(
    private readonly otpEmailProvider: OtpEmailProvider,
    private readonly googleWelcomeEmailProvider: GoogleWelcomeEmailProvider
  ) {}

  async sendOtp(payload: { email: string; otp: string }) {
    await this.otpEmailProvider.sendOtpEmail(payload);
  }

  async sendGoogleWelcome(payload: { email: string; firstName: string; imageUrl?: string }) {
    await this.googleWelcomeEmailProvider.send(payload);
  }
}