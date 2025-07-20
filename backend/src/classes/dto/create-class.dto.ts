import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
}
