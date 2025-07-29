import { IsNotEmpty, IsEmail, MinLength, IsEnum } from 'class-validator';

export class RegisterUserDto {
  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsEnum(['student', 'teacher'])
  role: string;
}
