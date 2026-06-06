import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, IsUUID } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Transform(({ value }) => parseFloat(value)) // multipart sends strings
  @IsNumber()
  @Min(0)
  price: number;

  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(0)
  stock: number;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  
    @IsOptional()
    files: string[];
}