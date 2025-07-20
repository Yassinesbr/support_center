import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.student.findMany({ include: { user: true } });
  }

  findOne(id: string) {
    return this.prisma.student.findUnique({
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
        role: 'student',
        student: { create: {} },
      },
      include: { student: true },
    });
  }
}
