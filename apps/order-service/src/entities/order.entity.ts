import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { OrderItem } from "./order.item.entity";

export enum OrderStatus {
  PENDING = "pending",
  AWAITING_PAYMENT = "awaiting_payment",
  PAYMENT_CONFIRMED = "payment_confirmed",
  PROCESSING_SHIPMENT = "processing_shipment",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}
@Entity()
export class Order {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "varchar",
    nullable: false,
  })
  buyerId: string;

  @Column({
    type: "varchar",
    nullable: false,
  })
  buyerEmail: string;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
  })
  totalAmount: number;

  @Column({
    type: "enum",
    enum: OrderStatus,
    default: OrderStatus.AWAITING_PAYMENT,
  })
  orderStatus: OrderStatus;

  @OneToMany(() => OrderItem, (item) => item.order)
  orderItem: OrderItem[];


  @CreateDateColumn()
  createdAt:Date

  @UpdateDateColumn()
  updatedAt:Date
}
