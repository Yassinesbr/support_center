import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InvoiceStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class BillingScheduler {
  constructor(private prisma: PrismaService) {}

  // Run every day at 02:00 to mark overdue invoices
  @Cron('0 2 * * *')
  async markOverdue() {
    await this.prisma.invoice.updateMany({
      where: { status: InvoiceStatus.DUE, dueDate: { lt: new Date() } },
      data: { status: InvoiceStatus.OVERDUE },
    });
  }
}
