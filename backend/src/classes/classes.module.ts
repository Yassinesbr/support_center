import { Module } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';
import { PrismaService } from 'src/prisma.service';
import { BillingModule } from 'src/billing/billing.module';

@Module({
  imports: [BillingModule],
  controllers: [ClassesController],
  providers: [ClassesService, PrismaService],
  exports: [ClassesService],
})
export class ClassesModule {}
