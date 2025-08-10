import { IsInt, Min, Max } from 'class-validator';

export class CreateClassTimeDto {
  @IsInt() @Min(0) @Max(6) dayOfWeek!: number; // 0..6
  @IsInt() @Min(0) @Max(1440) startMinutes!: number; // 0..1440
  @IsInt() @Min(0) @Max(1440) endMinutes!: number; // > start
}
