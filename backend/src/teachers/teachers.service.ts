import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.teacher.findMany({ include: { user: true } });
  }

  findOne(id: string) {
    return this.prisma.teacher.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  async create(data: { name: string; email: string; password: string }) {
    const hashed = await require('bcrypt').hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        role: 'teacher',
        teacher: { create: {} },
      },
      include: { teacher: true },
    });
  }
}
