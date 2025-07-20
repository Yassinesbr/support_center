import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from './dto/register-user.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async validateUser(email: string, pass: string) {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: { id: string; email: string; role: string }) {
    const payload = { username: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  // --- Registration (NEW) ---
  async register(dto: RegisterUserDto) {
    // 1. Check for duplicate email
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new BadRequestException('Email already registered');

    // 2. Hash password
    const hashed = await bcrypt.hash(dto.password, 10);

    // 3. Create user
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashed,
        role: dto.role as Role,
      },
    });

    // 4. Create Student/Teacher profile as needed
    if (dto.role === 'student') {
      await this.prisma.student.create({ data: { userId: user.id } });
    } else if (dto.role === 'teacher') {
      await this.prisma.teacher.create({ data: { userId: user.id } });
    }

    // 5. Return public info
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }

  // --- Profile (NEW) ---
  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    });
  }
}
