import { Module } from "@nestjs/common";
import { NotificationServiceController } from "./notification-service.controller";
import { NotificationService } from "./notification-service.service";
import { MailerModule } from "@nestjs-modules/mailer";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EjsAdapter } from "@nestjs-modules/mailer/dist/adapters/ejs.adapter";
import { join } from "path";
import { KafkaModule } from "@app/kafka";
import { GoogleWelcomeEmailProvider } from "./providers/google-email-provider";
import { OtpEmailProvider } from "./providers/otp-email-provider";
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `apps/notification-service/.env.${process.env.NODE_ENV || "development"}`,
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.getOrThrow("SMTP_HOST"),
          port: configService.getOrThrow("SMTP_PORT"),
          ignoreTLS: configService.getOrThrow("SMTP_IGNORE_TLS") === "true",
          secure: configService.getOrThrow("SMTP_SECURE") === "true",
        },
        auth: {
          user: configService.getOrThrow("SMTP_USER", ""),
          pass: configService.getOrThrow("SMTP_PASS", ""),
        },
        defaults: {
          from: configService.get(
            "SMTP_FROM",
            ' "Dewaju Mart" noreply@dewaju-mart.com'
          ),
        },
        template: {
          dir: join(__dirname, "templates"),
          adapter: new EjsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),

    KafkaModule.register("notification-service-group"),
  ],
  controllers: [NotificationServiceController],
  providers: [
    NotificationService,
    GoogleWelcomeEmailProvider,
    OtpEmailProvider,
  ],
})
export class NotificationServiceModule {}
