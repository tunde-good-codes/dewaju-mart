import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { OrderService } from "./order.service";
import { OrderController } from "./order.controller";


@Module({
imports:[HttpModule],
providers:[OrderService], 
controllers:[OrderController]

})

export class OrderModule{}