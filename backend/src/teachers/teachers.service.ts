import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

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

  async create(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) {
    const hashed = await require('bcrypt').hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: hashed,
        role: 'teacher',
        teacher: { create: {} },
      },
      include: { teacher: true },
    });
  }

  async update(id: string, updateData: UpdateTeacherDto) {
    console.log('Updating teacher with ID:', id);
    // Check if teacher exists
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Separate user data from teacher data
    const { email, firstName, lastName, salary, ...teacherData } = updateData;
    // Update user data if provided
    const userUpdateData: any = {};
    if (email) userUpdateData.email = email;
    if (firstName) userUpdateData.firstName = firstName;
    if (lastName) userUpdateData.lastName = lastName;

    // Convert salary to number if present and not undefined/null
    let parsedSalary: number | null | undefined = undefined;
    if (salary !== undefined) {
      parsedSalary = salary === null ? null : Number(salary);
      if (salary !== null && parsedSalary !== null && isNaN(parsedSalary)) {
        throw new Error('Invalid salary value');
      }
    }

    // Update teacher record
    const updatedTeacher = await this.prisma.teacher.update({
      where: { id },
      data: {
        user: {
          update: userUpdateData,
        },
        ...teacherData,
      },
      include: { user: true },
    });

    return updatedTeacher;
  }
}
