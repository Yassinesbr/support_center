import { IsNotEmpty, IsString } from 'class-validator';

export class AddStudentDto {
  @IsNotEmpty()
  @IsString()
  studentId: string;
}
