import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Order } from "./order.entity";

@Entity()
export class OrderItem {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Order, (order) => order.orderItem, { onDelete: "CASCADE" })
  @JoinColumn({ name: "orderId" })
  order: Order;

  @Column({
    type: "varchar",
  })
  orderId: string;

  @Column({
    type: "varchar",
  })
  productId: string;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
  })
  unitPrice: number;

  @Column({
    type: "varchar",
  })
  productName: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  subTotal: number;

  @Column({ type: "int" })
  quantity: number;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
