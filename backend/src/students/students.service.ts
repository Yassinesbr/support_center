import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  findAll(search?: string) {
    return this.prisma.student.findMany({
      where: search
        ? {
            OR: [
              {
                user: { firstName: { contains: search, mode: 'insensitive' } },
              },
              { user: { lastName: { contains: search, mode: 'insensitive' } } },
              { user: { email: { contains: search, mode: 'insensitive' } } },
              { phone: { contains: search, mode: 'insensitive' } },
              { parentName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: { user: true },
    });
  }

  findOne(id: string) {
    return this.prisma.student.findUnique({
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
        role: 'student',
        student: { create: {} },
      },
      include: { student: true },
    });
  }

  async update(id: string, updateData: UpdateStudentDto) {
    // Check if student exists
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Separate user data from student data
    const { email, firstName, lastName, ...studentData } = updateData;

    // Update user data if provided
    const userUpdateData: any = {};
    if (email) userUpdateData.email = email;
    if (firstName) userUpdateData.firstName = firstName;
    if (lastName) userUpdateData.lastName = lastName;

    // Update student record
    const updatedStudent = await this.prisma.student.update({
      where: { id },
      data: {
        ...studentData,
        ...(Object.keys(userUpdateData).length > 0 && {
          user: {
            update: userUpdateData,
          },
        }),
      },
      include: { user: true },
    });

    return updatedStudent;
  }
}
