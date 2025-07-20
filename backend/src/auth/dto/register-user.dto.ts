import { IsNotEmpty, IsEmail, MinLength, IsEnum } from 'class-validator';

export class RegisterUserDto {
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsEnum(['student', 'teacher'])
  role: string;
}
