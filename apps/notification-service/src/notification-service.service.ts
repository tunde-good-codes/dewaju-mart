import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { OtpEmailProvider } from "./providers/otp-email-provider";
import { GoogleWelcomeEmailProvider } from "./providers/google-email-provider";
import { KAFKA_SERVICE } from "@app/kafka";
import { ClientKafka } from "@nestjs/microservices";
import { UserRegisteredProvider } from "./providers/user-registered-email-provider";

@Injectable()
export class NotificationService implements OnModuleInit {
  constructor(
    private readonly otpEmailProvider: OtpEmailProvider,
    private readonly googleWelcomeEmailProvider: GoogleWelcomeEmailProvider,
    private readonly userRegistered:UserRegisteredProvider,
    @Inject(KAFKA_SERVICE)
    private readonly kafkaClient:ClientKafka
  ) {}


  async onModuleInit() {
     await this.kafkaClient.connect()
  }
  async sendOtp(payload: { email: string; otp: string }) {
    await this.otpEmailProvider.sendOtpEmail(payload);
  }

  async sendGoogleWelcome(payload: { email: string; firstName: string; imageUrl?: string }) {
    await this.googleWelcomeEmailProvider.send(payload);
  }
async userEmailRegister(data:{firstName:string, email:string}){
return this.userRegistered.send(data)
}
  getHello(){
    return "hello"
  }
}