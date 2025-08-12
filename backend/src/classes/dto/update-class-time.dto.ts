import { Transform } from 'class-transformer';
import { IsInt, Min, Max, IsOptional } from 'class-validator';

export class UpdateClassTimeDto {
  @IsOptional() @IsInt() @Min(0) @Max(6) dayOfWeek?: number;
  @IsOptional() @IsInt() @Min(0) @Max(1440) startMinutes?: number;
  @IsOptional() @IsInt() @Min(0) @Max(1440) endMinutes?: number;
  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'string') return Number.parseInt(value, 10);
    return value;
  })
  monthlyPriceCents?: number;
}
