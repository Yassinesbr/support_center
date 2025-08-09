import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UpdateStudentDto } from './dto/update-student.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

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
