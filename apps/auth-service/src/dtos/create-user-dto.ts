import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiProperty({
    description: "The first name of the user",
    example: "John",
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: "The last name of the user",
    example: "Doe",
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: "The primary electronic mail address of the user",
    example: "johndoe@example.com",
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  role?: string;

  @ApiProperty({
    description:
      "A secure authentication password. Must be at least 8 characters long.",
    example: "P@ssword123!",
    required: false, // Explicitly displays as optional in the docs UI
  })
  @IsString()
  @IsOptional()
  @MinLength(8)
  password?: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    description: "The primary electronic mail address of the user",
    example: "johndoe@example.com",
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6)
  @IsNotEmpty()
  otp: string;
}
