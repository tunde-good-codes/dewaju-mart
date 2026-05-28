import { VerifyEmailOtpProvider } from './providers/verify-email-otp';
import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { OtpEmailProvider } from "./providers/otp-email-provider";
import { GoogleWelcomeEmailProvider } from "./providers/google-email-provider";
import { KAFKA_SERVICE } from "@app/kafka";
import { ClientKafka } from "@nestjs/microservices";
import { UserRegisteredProvider } from "./providers/user-registered-email-provider";
import { ResetPasswordProvider } from "./providers/reset-password-provider";

@Injectable()
export class NotificationService implements OnModuleInit {
  constructor(
    private readonly otpEmailProvider: OtpEmailProvider,
    private readonly googleWelcomeEmailProvider: GoogleWelcomeEmailProvider,
    private readonly userRegistered: UserRegisteredProvider,
    private readonly resetPasswordProvider: ResetPasswordProvider,
    private readonly verifyEmailOtpProvider: VerifyEmailOtpProvider,
    @Inject(KAFKA_SERVICE)
    private readonly kafkaClient: ClientKafka
  ) {}

  async onModuleInit() {
    await this.kafkaClient.connect();
  }
  async sendOtp(payload: { email: string; otp: string }) {
    await this.otpEmailProvider.sendOtpEmail(payload);
  }

  async sendGoogleWelcome(payload: {
    email: string;
    firstName: string;
    imageUrl?: string;
  }) {
    await this.googleWelcomeEmailProvider.send(payload);
  }
  async userEmailRegister(data: { firstName: string; email: string }) {
    return this.userRegistered.send(data);
  }

  async resetPasswordOtp(data: {
    otp: string;
    email: string;
    firstName: string;
  }) {
    await this.resetPasswordProvider.sendEmail(data);
  }

  async verifyEmailOtp(data: { name: string; email: string; otp: string}) {
    await this.verifyEmailOtpProvider.sendEmail(data)
  }
  getHello() {
    return "hello";
  }
}
