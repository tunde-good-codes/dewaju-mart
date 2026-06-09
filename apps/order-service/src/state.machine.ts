import { BadRequestException } from "@nestjs/common";
import { OrderStatus } from "./entities/order.entity";



const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.AWAITING_PAYMENT, OrderStatus.CANCELLED],
  [OrderStatus.AWAITING_PAYMENT]: [OrderStatus.PAYMENT_CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.PAYMENT_CONFIRMED]: [OrderStatus.PROCESSING_SHIPMENT],
  [OrderStatus.PROCESSING_SHIPMENT]: [OrderStatus.SHIPPED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

export function transitionOrderStatus(
  current: OrderStatus,
  next: OrderStatus
): OrderStatus {
  const allowed = VALID_TRANSITIONS[current];

  if (!allowed.includes(next)) {
    throw new BadRequestException(
      `Cannot transition order from '${current}' to '${next}'`
    );
  }

  return next;
}