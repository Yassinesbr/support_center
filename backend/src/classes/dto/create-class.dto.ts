import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';

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
}
