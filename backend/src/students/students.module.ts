import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { StudentsService } from './students.service';
import { PrismaService } from 'src/prisma.service';
import { StudentsController } from './students.controller';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [UsersModule, BillingModule],
  controllers: [StudentsController],
  providers: [StudentsService, PrismaService],
})
export class StudentsModule {}
