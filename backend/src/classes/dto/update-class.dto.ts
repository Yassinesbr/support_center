import {
  IsOptional,
  IsString,
  IsDateString,
  IsInt,
  Min,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ClassPricingMode } from '@prisma/client';

export class UpdateClassDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() teacherId?: string;
  @IsOptional() @IsDateString() startAt?: string;
  @IsOptional() @IsDateString() endAt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'string') return Number.parseInt(value, 10);
    return value;
  })
  monthlyPriceCents?: number;

  @IsEnum(ClassPricingMode)
  @IsOptional()
  pricingMode?: ClassPricingMode;

  @IsInt()
  @IsOptional()
  fixedMonthlyPriceCents?: number;

  @IsInt()
  @IsOptional()
  teacherFixedMonthlyPayCents?: number;
}
