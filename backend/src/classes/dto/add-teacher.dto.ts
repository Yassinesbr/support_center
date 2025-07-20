import { IsNotEmpty, IsString } from 'class-validator';

export class AddTeacherDto {
  @IsNotEmpty()
  @IsString()
  teacherId: string;
}
