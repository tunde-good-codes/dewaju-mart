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
import { UserRegisteredProvider } from "./providers/user-registered-email-provider";
import { ResetPasswordProvider } from "./providers/reset-password-provider";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `${process.cwd()}/apps/notification-service/.env.${process.env.NODE_ENV || "development"}`,
    }),

    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          transport: {
            host: configService.getOrThrow<string>("SMTP_HOST"),
            port: Number(configService.getOrThrow("SMTP_PORT")),
            ignoreTLS: configService.get("SMTP_IGNORE_TLS") === "true",
            secure: configService.get("SMTP_SECURE") === "true",
            auth: configService.get("SMTP_USER")
              ? {
                  user: configService.get("SMTP_USER"),
                  pass: configService.get("SMTP_PASS"),
                }
              : undefined, // Strips out auth completely for Mailhog since it doesn't need it
          },
          defaults: {
            from: configService.get(
              "SMTP_FROM",
              '"Dewaju Mart" <noreply@dewaju-mart.com>'
            ),
          },
          template: {
            dir: join(
              process.cwd(),
              "dist/apps/notification-service/src/templates"
            ),
            adapter: new EjsAdapter(),
            options: {
              strict: false,
            },
          },
        };
      },
    }),

    KafkaModule.register("notification-service-group"),
  ],
  controllers: [NotificationServiceController],
  providers: [
    NotificationService,
    GoogleWelcomeEmailProvider,
    OtpEmailProvider,
    UserRegisteredProvider,
    ResetPasswordProvider,
  ],
})
export class NotificationServiceModule {}
