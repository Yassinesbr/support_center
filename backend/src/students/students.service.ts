import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { InvoicesService } from 'src/billing/invoices.service';
import { UpdateStudentDto } from './dto/update-student.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class StudentsService {
  constructor(
    private prisma: PrismaService,
    private invoices: InvoicesService,
  ) {}

  async getOne(id: string) {
    return this.prisma.student.findUnique({
      where: { id },
      include: {
        user: true,
        classes: { select: { id: true, name: true, monthlyPriceCents: true } },
      },
    });
  }

  async setClasses(studentId: string, classIds: string[]) {
    // Optional: validate the class ids exist
    const existing = await this.prisma.class.findMany({
      where: { id: { in: classIds } },
      select: { id: true },
    });
    const validIds = new Set(existing.map((c) => c.id));
    const cleaned = classIds.filter((id) => validIds.has(id));

    const updated = await this.prisma.student.update({
      where: { id: studentId },
      data: {
        classes: {
          set: cleaned.map((id) => ({ id })), // replaces the whole list
        },
      },
      include: {
        user: true,
        classes: { select: { id: true, name: true, monthlyPriceCents: true } },
      },
    });

    await this.invoices.ensureUpcomingInvoiceForStudent(studentId);
    return updated;
  }

  async addClass(studentId: string, classId: string) {
    const updated = await this.prisma.student.update({
      where: { id: studentId },
      data: { classes: { connect: { id: classId } } },
      include: { classes: true, user: true },
    });
    await this.invoices.ensureUpcomingInvoiceForStudent(studentId);
    const monthlyTotalCents =
      updated.classes.reduce((s, c) => s + (c.monthlyPriceCents ?? 0), 0) ?? 0;
    return { ...updated, monthlyTotalCents };
  }

  async removeClass(studentId: string, classId: string) {
    const updated = await this.prisma.student.update({
      where: { id: studentId },
      data: { classes: { disconnect: { id: classId } } },
      include: { classes: true, user: true },
    });
    await this.invoices.ensureUpcomingInvoiceForStudent(studentId);
    const monthlyTotalCents =
      updated.classes.reduce((s, c) => s + (c.monthlyPriceCents ?? 0), 0) ?? 0;
    return { ...updated, monthlyTotalCents };
  }

  findAll(search?: string) {
    return this.prisma.student
      .findMany({
        where: search
          ? {
              OR: [
                {
                  user: {
                    firstName: { contains: search, mode: 'insensitive' },
                  },
                },
                {
                  user: {
                    lastName: { contains: search, mode: 'insensitive' },
                  },
                },
                {
                  user: {
                    email: { contains: search, mode: 'insensitive' },
                  },
                },
              ],
            }
          : undefined,
        include: {
          user: true,
          classes: {
            select: { id: true, name: true, monthlyPriceCents: true },
          },
        },
      })
      .then((rows) =>
        rows.map((s) => ({
          ...s,
          monthlyTotalCents: s.classes.reduce(
            (sum, c) => sum + (c.monthlyPriceCents ?? 0),
            0,
          ),
        })),
      );
  }

  async findOne(id: string) {
    const s = await this.prisma.student.findUnique({
      where: { id },
      include: {
        user: true,
        classes: { select: { id: true, name: true, monthlyPriceCents: true } },
      },
    });
    if (!s) throw new NotFoundException('Student not found');
    const monthlyTotalCents = s.classes.reduce(
      (sum, c) => sum + (c.monthlyPriceCents ?? 0),
      0,
    );
    return { ...s, monthlyTotalCents };
  }

  /**
   * Supports BOTH payload shapes:
   * 1) { firstName, lastName, email, password? }
   * 2) {
   *      user: { firstName, lastName, email, password? },
   *      birthDate?, address?, phone?, parentName?, parentPhone?,
   *      enrollmentDate?, paymentStatus?
   *    }
   *
   * If password is missing, generates a strong temporary one and returns it as __tempPassword.
   */
  async create(input: any) {
    // Normalize payload
    const hasNestedUser = !!input?.user;
    const userInput = hasNestedUser ? input.user : input;
    const studentInput = hasNestedUser ? { ...input, user: undefined } : {};

    if (!userInput?.email) {
      throw new BadRequestException('User email is required');
    }

    const plainPassword =
      userInput?.password && String(userInput.password).trim().length > 0
        ? String(userInput.password)
        : crypto.randomBytes(16).toString('base64url'); // temp password if none provided

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
    const hashed = await bcrypt.hash(plainPassword, saltRounds);

    // Build optional student fields (only set when provided)
    const studentCreateData: any = {};
    if (studentInput.birthDate)
      studentCreateData.birthDate = new Date(studentInput.birthDate);
    if (studentInput.address !== undefined)
      studentCreateData.address = studentInput.address ?? null;
    if (studentInput.phone !== undefined)
      studentCreateData.phone = studentInput.phone ?? null;
    if (studentInput.parentName !== undefined)
      studentCreateData.parentName = studentInput.parentName ?? null;
    if (studentInput.parentPhone !== undefined)
      studentCreateData.parentPhone = studentInput.parentPhone ?? null;
    if (studentInput.enrollmentDate)
      studentCreateData.enrollmentDate = new Date(studentInput.enrollmentDate);
    if (studentInput.paymentStatus !== undefined)
      studentCreateData.paymentStatus = studentInput.paymentStatus;

    const created = await this.prisma.user.create({
      data: {
        firstName: userInput.firstName ?? '',
        lastName: userInput.lastName ?? '',
        email: userInput.email,
        password: hashed,
        role: 'student',
        student: { create: studentCreateData }, // creates Student row even if empty
      },
      include: { student: true },
    });

    // Return temp password only when auto-generated
    return {
      ...created,
      __tempPassword: userInput?.password ? undefined : plainPassword,
    };
  }

  async update(id: string, updateData: UpdateStudentDto) {
    // Ensure student exists
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Separate user fields from student fields
    const { email, firstName, lastName, ...studentData } = updateData;

    const userUpdateData: any = {};
    if (email !== undefined) userUpdateData.email = email;
    if (firstName !== undefined) userUpdateData.firstName = firstName;
    if (lastName !== undefined) userUpdateData.lastName = lastName;

    const updatedStudent = await this.prisma.student.update({
      where: { id },
      data: {
        ...studentData,
        ...(Object.keys(userUpdateData).length > 0 && {
          user: { update: userUpdateData },
        }),
      },
      include: { user: true },
    });

    return updatedStudent;
  }
}
