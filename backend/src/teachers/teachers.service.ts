// src/teachers/teachers.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
// import { UpdateTeacherDto } from './dto/update-teacher.dto'; // uncomment if you have it

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  findAll(search?: string) {
    return this.prisma.teacher.findMany({
      where: search
        ? {
            OR: [
              {
                user: { firstName: { contains: search, mode: 'insensitive' } },
              },
              { user: { lastName: { contains: search, mode: 'insensitive' } } },
              { user: { email: { contains: search, mode: 'insensitive' } } },
              { phone: { contains: search, mode: 'insensitive' } },
              { subject: { contains: search, mode: 'insensitive' } }, // rename to speciality if needed
            ],
          }
        : undefined,
      include: { user: true },
    });
  }

  findOne(id: string) {
    return this.prisma.teacher.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  /**
   * Supports BOTH payload shapes:
   * 1) { firstName, lastName, email, password? }
   * 2) {
   *      user: { firstName, lastName, email, password? },
   *      birthDate?, address?, phone?, hiringDate?, subject?
   *    }
   *
   * If password missing, generates a strong temp one and returns it as __tempPassword.
   */
  async create(input: any) {
    // Normalize (accept flat or nested user)
    const hasNestedUser = !!input?.user;
    const userInput = hasNestedUser ? input.user : input;
    const teacherInput = hasNestedUser ? { ...input, user: undefined } : {};

    if (!userInput?.email) {
      throw new BadRequestException('Email is required');
    }

    const plainPassword =
      userInput?.password && String(userInput.password).trim().length > 0
        ? String(userInput.password)
        : randomBytes(16).toString('base64url');

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
    const hashed = await bcrypt.hash(plainPassword, saltRounds);

    // Optional teacher fields
    const teacherCreateData: any = {};
    if (teacherInput.birthDate)
      teacherCreateData.birthDate = new Date(teacherInput.birthDate);
    if (teacherInput.address !== undefined)
      teacherCreateData.address = teacherInput.address ?? null;
    if (teacherInput.phone !== undefined)
      teacherCreateData.phone = teacherInput.phone ?? null;
    if (teacherInput.hiringDate)
      teacherCreateData.hiringDate = new Date(teacherInput.hiringDate);
    if (teacherInput.subject !== undefined)
      teacherCreateData.subject = teacherInput.subject ?? null; // rename if 'speciality'

    const created = await this.prisma.user.create({
      data: {
        firstName: userInput.firstName ?? '',
        lastName: userInput.lastName ?? '',
        email: userInput.email,
        password: hashed,
        role: 'teacher',
        teacher: { create: teacherCreateData },
      },
      include: { teacher: true },
    });

    return {
      ...created,
      __tempPassword: userInput?.password ? undefined : plainPassword,
    };
  }

  // If you have UpdateTeacherDto, keep this; otherwise remove or adapt.
  async update(id: string, updateData: any /* UpdateTeacherDto */) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    // Separate user fields from teacher fields
    const { email, firstName, lastName, ...teacherFields } = updateData;

    const userUpdate: any = {};
    if (email !== undefined) userUpdate.email = email;
    if (firstName !== undefined) userUpdate.firstName = firstName;
    if (lastName !== undefined) userUpdate.lastName = lastName;

    // Normalize date-like fields if present
    const teacherUpdate: any = { ...teacherFields };
    if (teacherUpdate.hiringDate)
      teacherUpdate.hiringDate = new Date(teacherUpdate.hiringDate);
    if (teacherUpdate.birthDate)
      teacherUpdate.birthDate = new Date(teacherUpdate.birthDate);

    const updated = await this.prisma.teacher.update({
      where: { id },
      data: {
        ...teacherUpdate,
        ...(Object.keys(userUpdate).length > 0 && {
          user: { update: userUpdate },
        }),
      },
      include: { user: true },
    });

    return updated;
  }
}
