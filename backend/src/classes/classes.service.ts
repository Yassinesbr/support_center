import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { CreateClassTimeDto } from './dto/create-class-time.dto';
import { UpdateClassTimeDto } from './dto/update-class-time.dto';
import { InvoicesService } from 'src/billing/invoices.service';

@Injectable()
export class ClassesService {
  constructor(
    private prisma: PrismaService,
    private invoices: InvoicesService,
  ) {}

  async findAll() {
    return this.prisma.class.findMany({
      include: {
        teacher: { include: { user: true } },
        students: { include: { user: true } },
        classTimes: true,
      },
      orderBy: { startAt: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.class.findUnique({
      where: { id },
      include: {
        teacher: { include: { user: true } },
        students: { include: { user: true } },
        classTimes: true, // new relation
      },
    });
  }

  async create(data: CreateClassDto) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: data.teacherId },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    return this.prisma.class.create({
      data: { ...data },
      include: {
        teacher: { include: { user: true } },
        students: { include: { user: true } },
      },
    });
  }

  async addStudent(classId: string, studentId: string) {
    const res = await this.prisma.class.update({
      where: { id: classId },
      data: { students: { connect: { id: studentId } } },
      include: { students: true },
    });
    await this.invoices.ensureUpcomingInvoiceForStudent(studentId);
    return res;
  }

  async removeStudent(classId: string, studentId: string) {
    const res = await this.prisma.class.update({
      where: { id: classId },
      data: { students: { disconnect: { id: studentId } } },
      include: { students: true },
    });
    await this.invoices.ensureUpcomingInvoiceForStudent(studentId);
    return res;
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

  async update(id: string, data: UpdateClassDto) {
    const existing = await this.prisma.class.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Class not found');

    return this.prisma.class.update({
      where: { id },
      data: { ...data },
      include: {
        teacher: { include: { user: true } },
        students: { include: { user: true } },
        classTimes: true,
      },
    });
  }

  async remove(id: string) {
    // cascade deletes ClassTime via FK if desired (or deleteMany first)
    await this.prisma.classTime.deleteMany({ where: { classId: id } });
    return this.prisma.class.delete({ where: { id } });
  }

  // ---- Times ----
  async listTimes(classId: string) {
    await this.ensureClass(classId);
    return this.prisma.classTime.findMany({
      where: { classId },
      orderBy: [{ dayOfWeek: 'asc' }, { startMinutes: 'asc' }],
    });
  }

  async addTime(classId: string, dto: CreateClassTimeDto) {
    await this.ensureClass(classId);
    if (dto.endMinutes <= dto.startMinutes) {
      throw new NotFoundException(
        'endMinutes must be greater than startMinutes',
      );
    }
    return this.prisma.classTime.create({ data: { classId, ...dto } });
  }

  async updateTime(classId: string, timeId: string, dto: UpdateClassTimeDto) {
    await this.ensureClass(classId);
    const time = await this.prisma.classTime.findUnique({
      where: { id: timeId },
    });
    if (!time || time.classId !== classId)
      throw new NotFoundException('Time not found');

    const next = {
      dayOfWeek: dto.dayOfWeek ?? time.dayOfWeek,
      startMinutes: dto.startMinutes ?? time.startMinutes,
      endMinutes: dto.endMinutes ?? time.endMinutes,
    };
    if (next.endMinutes <= next.startMinutes) {
      throw new NotFoundException(
        'endMinutes must be greater than startMinutes',
      );
    }

    return this.prisma.classTime.update({ where: { id: timeId }, data: dto });
  }

  async removeTime(classId: string, timeId: string) {
    await this.ensureClass(classId);
    const time = await this.prisma.classTime.findUnique({
      where: { id: timeId },
    });
    if (!time || time.classId !== classId)
      throw new NotFoundException('Time not found');
    return this.prisma.classTime.delete({ where: { id: timeId } });
  }

  private async ensureClass(classId: string) {
    const klass = await this.prisma.class.findUnique({
      where: { id: classId },
    });
    if (!klass) throw new NotFoundException('Class not found');
  }
}
