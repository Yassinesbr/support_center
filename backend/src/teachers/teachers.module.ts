import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { TeachersService } from './teachers.service';
import { PrismaService } from 'src/prisma.service';
import { TeachersController } from './teachers.controller';

@Module({
  imports: [UsersModule],
  controllers: [TeachersController],
  providers: [TeachersService, PrismaService],
})
export class TeachersModule {}
