import { IsInt, Min, Max, IsOptional } from 'class-validator';

export class UpdateClassTimeDto {
  @IsOptional() @IsInt() @Min(0) @Max(6) dayOfWeek?: number;
  @IsOptional() @IsInt() @Min(0) @Max(1440) startMinutes?: number;
  @IsOptional() @IsInt() @Min(0) @Max(1440) endMinutes?: number;
}
