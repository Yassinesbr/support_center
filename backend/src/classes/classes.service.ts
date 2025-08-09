import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateClassDto } from './dto/create-class.dto';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.class.findMany({
      include: {
        teacher: { include: { user: true } },
        students: { include: { user: true } },
      },
      orderBy: { startAt: 'asc' },
    });
  }

  async create(data: CreateClassDto) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: data.teacherId },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    return this.prisma.class.create({
      data: {
        name: data.name,
        description: data.description,
        teacherId: data.teacherId,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
      },
      include: {
        teacher: { include: { user: true } },
        students: { include: { user: true } },
      },
    });
  }

  async addStudent(classId: string, studentId: string) {
    // Check class exists
    const classObj = await this.prisma.class.findUnique({
      where: { id: classId },
    });
    if (!classObj) throw new NotFoundException('Class not found');

    // Check student exists
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('Student not found');

    return this.prisma.class.update({
      where: { id: classId },
      data: {
        students: { connect: { id: studentId } },
      },
      include: {
        teacher: { include: { user: true } },
        students: { include: { user: true } },
      },
    });
  }

  async addTeacher(classId: string, teacherId: string) {
    // Check class exists
    const classObj = await this.prisma.class.findUnique({
      where: { id: classId },
    });
    if (!classObj) throw new NotFoundException('Class not found');

    // Check teacher exists
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    return this.prisma.class.update({
      where: { id: classId },
      data: { teacherId },
      include: {
        teacher: { include: { user: true } },
        students: { include: { user: true } },
      },
    });
  }
}
