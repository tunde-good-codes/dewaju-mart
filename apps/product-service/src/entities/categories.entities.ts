import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Product } from "./product.entities";

@Entity()
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "varchar",
    nullable: false,
    unique: true,
  })
  name: string;


  @Column({
    type:"text", nullable:true
  })
  slug:string
  @Column({
    type: "text",
    nullable: true,
  })
  description: string;

  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "parentId" })
  parent: Category;

  @Column({
    nullable: true,
    default: null,
  })
  parentId: string;
  // a category can have many syb-categories -> subCategories
  @OneToMany(() => Category, (category) => category.parent, {
    nullable: true,
  })
  children: Category[];


  @OneToMany(()=>Product, product => product.category, {
    nullable:true,
  })
  products:Product[]
}
