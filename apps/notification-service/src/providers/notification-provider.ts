import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@WebSocketGateway({
  cors: { origin: "*" }, 
  namespace: "/notifications",
})
export class NotificationProvider
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger("NotificationProvider");

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  afterInit() {
    this.logger.log("WebSocket gateway initialized");
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        (client.handshake.query?.token as string);

      if (!token) {
        this.logger.warn(`No token from client ${client.id} — disconnecting`);
        client.disconnect();
        return;
      }


      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.getOrThrow<string>("JWT_SECRET"),
      });

      const userId = payload.sub;

      await client.join(`user:${userId}`);
      client.data.userId = userId;

      this.logger.log(`✅ User ${userId} connected → room user:${userId}`);
    } catch (error) {
      this.logger.warn(`Invalid token — disconnecting client ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(
      `Client disconnected: ${client.id} (userId: ${client.data?.userId})`
    );
  }


  sendToUser(userId: string, event: string, payload: Record<string, any>) {
    this.server.to(`user:${userId}`).emit(event, {
      ...payload,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Pushed "${event}" to user:${userId}`);
  }
}
