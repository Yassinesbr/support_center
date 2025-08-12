import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { PdfService } from './pdf.service';
import { ScheduleModule } from '@nestjs/schedule';
import { BillingScheduler } from './billing.scheduler';
import { PrismaService } from 'src/prisma.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [InvoicesController],
  providers: [PrismaService, InvoicesService, PdfService, BillingScheduler],
  exports: [InvoicesService],
})
export class BillingModule {}
