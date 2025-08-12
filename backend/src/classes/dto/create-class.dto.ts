import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  isInt,
  Min,
  IsInt,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateClassDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  teacherId: string;

  @IsNotEmpty()
  @IsDateString()
  startAt: string; // ISO string

  @IsNotEmpty()
  @IsDateString()
  endAt: string; // ISO string

  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    // If it’s a string like "150000", parse as int
    if (typeof value === 'string') return Number.parseInt(value, 10);
    return value; // already a number
  })
  monthlyPriceCents?: number;
}
