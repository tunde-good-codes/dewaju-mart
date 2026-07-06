import { Controller, Get } from "@nestjs/common";
import { GatewayService } from "./gateway.service";
import { ApiTags } from "@nestjs/swagger";
import { ApiGetService } from "libs/decorator/swagger.decorator";

@ApiTags("Gateway Service")
@Controller()
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @Get()
  getHello(): string {
    return this.gatewayService.getHello();
  }

  @ApiGetService("this service is alive and active")
  @Get("health")
  health() {
    return {
      status: "ok",
      service: "order-service",
      timestamp: new Date().toISOString(),
    };
  }
}
