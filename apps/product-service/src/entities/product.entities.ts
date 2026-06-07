import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Category } from "./categories.entities";

@Entity()
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id: string;
  @Column({
    type: "text",
    nullable: false,
  })
  name: string;

  @Column({
    type: "text",
    nullable: true,
  })
  description: string;

  @Column({
    type: "text",
    nullable: true,
  })
  slug: string;
  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: number;
  @Column({ default: false })
  isDeleted: boolean;

  @Column({
    type: "int",
    default: 0,
  })
  stock: number;

  @ManyToOne(() => Category, (category) => category.products, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "categoryId" })
  category: Category;

  @Column({
    nullable: true,
    type: "varchar",
  })
  categoryId: string;
  @Column({ type: "text", array: true, default: "{}" })
  imageUrls: string[];

  @Column("text", { array: true, default: "{}", select: false })
  imagePublicIds: string[];
  @Column({
    nullable: true,
    type: "varchar",
  })
  sellerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
