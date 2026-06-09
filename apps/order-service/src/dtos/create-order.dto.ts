import { Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsUUID,
  Min,
  ValidateNested,
  ArrayMinSize,
} from "class-validator";

export class OrderItemDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}