import {
  Auth,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum UserRole {
  SELLER = "seller",
  BUYER = "buyer",
  ADMIN = "admin",
}

export enum AuthProvider {
  LOCAL = "local",
  GOOGLE = "google",
}
@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "varchar",
    unique: true,
    nullable: false,
  })
  email: string;
  @Column({
    type: "varchar",
    nullable: false,
  })
  firstName: string;

  @Column({
    type: "varchar",
    nullable: false,
  })
  lastName: string;

  @Column({
    type: "text",
    nullable: true,
  })
  imageUrl?: string;

  @Column({ nullable: true, select: false })
  imagePublicId?: string;
  @Column({
    type: "varchar",
    nullable: true,
  })
  password?: string;

  @Column({
    type: "varchar",
    nullable: true,
  })
  googleId?: string;
  @Column({ type: "boolean", default: false })
  isVerified: boolean;
  @Column({ type: "bigint", default: 1 })
  tokenVersion: number;
  @Column({ type: "text", nullable: true, default: null })
  refreshToken: string | null;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.ADMIN,
  })
  role: UserRole;

  @Column({
    type: "enum",
    enum: AuthProvider,
    default: AuthProvider.LOCAL,
  })
  provider: AuthProvider;
  @Column({
    type: "boolean",
    nullable: true,
    default: false,
  })
  isAdmin: boolean;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
