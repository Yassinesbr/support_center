import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InvoiceStatus, ItemStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { PdfService } from './pdf.service';

const firstDay = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1);
};

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private pdf: PdfService,
  ) {}

  // src/billing/invoices.service.ts
  listInvoices({ studentId }: { studentId?: string }) {
    return this.prisma.invoice.findMany({
      where: { studentId: studentId || undefined },
      orderBy: { issueDate: 'desc' },
      include: {
        student: { include: { user: true } }, // ← add this
        items: { include: { class: true } },
        payments: true,
      },
    });
  }

  async getInvoice(id: string) {
    const inv = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        items: { include: { class: true } },
        payments: true,
        student: { include: { user: true } },
      },
    });
    if (!inv) throw new NotFoundException('Invoice not found');
    return inv;
  }

  // One invoice per student per month; items = all classes of the student in that month
  async generateMonthlyInvoices(month: string) {
    const billedMonth = firstDay(month);
    const dueDate = new Date(billedMonth);
    dueDate.setDate(dueDate.getDate() + 10);

    const students = await this.prisma.student.findMany({
      include: { classes: true },
    });

    const results: any[] = [];

    for (const s of students) {
      if (!s.classes.length) continue;

      // Skip if invoice with any item for this month already exists
      const existing = await this.prisma.invoice.findFirst({
        where: { studentId: s.id, items: { some: { billedMonth } } },
        select: { id: true, number: true },
      });
      if (existing) {
        results.push({
          studentId: s.id,
          number: existing.number,
          skipped: true,
        });
        continue;
      }

      const items = s.classes.map((c) => ({
        classId: c.id,
        billedMonth,
        description: `${c.name} - ${billedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
        quantity: 1,
        unitPriceCents: c.monthlyPriceCents ?? 0,
        lineTotalCents: c.monthlyPriceCents ?? 0,
      }));

      const subtotal = items.reduce((t, i) => t + i.lineTotalCents, 0);
      const seq = Math.floor(Math.random() * 9000) + 1000;
      const number = `INV-${billedMonth.getFullYear()}-${String(billedMonth.getMonth() + 1).padStart(2, '0')}-${seq}`;

      const created = await this.prisma.invoice.create({
        data: {
          number,
          studentId: s.id,
          issueDate: new Date(),
          dueDate,
          status: InvoiceStatus.DUE,
          subtotalCents: subtotal,
          items: { create: items },
        },
      });

      results.push({ studentId: s.id, number: created.number });
    }

    return { month, created: results };
  }

  /**
   * Ensure the current month's invoice for a single student exists and
   * includes all of their classes as items.
   */
  async ensureUpcomingInvoiceForStudent(studentId: string) {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      '0',
    )}`;
    const billedMonth = firstDay(month);
    const dueDate = new Date(billedMonth);
    dueDate.setDate(dueDate.getDate() + 10);

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { classes: true },
    });
    if (!student || student.classes.length === 0) return;

    let invoice = await this.prisma.invoice.findFirst({
      where: { studentId, items: { some: { billedMonth } } },
      include: { items: true },
    });

    if (invoice) {
      const existingIds = new Set(invoice.items.map((i) => i.classId));
      const toAdd = student.classes.filter((c) => !existingIds.has(c.id));
      if (!toAdd.length) return invoice;

      const newItems = toAdd.map((c) => ({
        invoiceId: invoice!.id,
        classId: c.id,
        billedMonth,
        description: `${c.name} - ${billedMonth.toLocaleString('default', {
          month: 'long',
          year: 'numeric',
        })}`,
        quantity: 1,
        unitPriceCents: c.monthlyPriceCents ?? 0,
        lineTotalCents: c.monthlyPriceCents ?? 0,
      }));

      await this.prisma.invoiceItem.createMany({ data: newItems });

      const increment = newItems.reduce((s, i) => s + i.lineTotalCents, 0);
      invoice = await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: { subtotalCents: { increment } },
        include: { items: true },
      });

      return invoice;
    } else {
      const items = student.classes.map((c) => ({
        classId: c.id,
        billedMonth,
        description: `${c.name} - ${billedMonth.toLocaleString('default', {
          month: 'long',
          year: 'numeric',
        })}`,
        quantity: 1,
        unitPriceCents: c.monthlyPriceCents ?? 0,
        lineTotalCents: c.monthlyPriceCents ?? 0,
      }));

      const subtotal = items.reduce((t, i) => t + i.lineTotalCents, 0);
      const seq = Math.floor(Math.random() * 9000) + 1000;
      const number = `INV-${billedMonth.getFullYear()}-${String(
        billedMonth.getMonth() + 1,
      ).padStart(2, '0')}-${seq}`;

      invoice = await this.prisma.invoice.create({
        data: {
          number,
          studentId,
          issueDate: new Date(),
          dueDate,
          status: InvoiceStatus.DUE,
          subtotalCents: subtotal,
          items: { create: items },
        },
        include: { items: true },
      });

      return invoice;
    }
  }

  async payInvoice(
    id: string,
    dto: { amountCents: number; method?: string; reference?: string },
  ) {
    const inv = await this.getInvoice(id);
    if (inv.status === 'PAID') return inv;
    if (dto.amountCents < inv.subtotalCents) {
      throw new BadRequestException('Partial payments not supported yet');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          invoiceId: inv.id,
          amountCents: dto.amountCents,
          method: dto.method || 'manual',
          reference: dto.reference,
        },
      });

      return tx.invoice.update({
        where: { id: inv.id },
        data: { status: InvoiceStatus.PAID, paidCents: dto.amountCents },
      });
    });
  }

  async generatePdf(id: string) {
    const inv = await this.getInvoice(id);
    const buffer = await this.pdf.invoice(inv);
    return { buffer, filename: `${inv.number}.pdf` };
  }

  async payInvoiceItem(params: {
    invoiceId: string;
    itemId: string;
    amountCents: number;
    method?: string;
    reference?: string;
  }) {
    const { invoiceId, itemId, amountCents, method, reference } = params;

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true, payments: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const item = invoice.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException('Invoice item not found');

    const remainingCents = item.lineTotalCents - item.paidCents;
    if (remainingCents <= 0)
      return { invoiceId, itemId, status: 'already_paid' };
    if (amountCents <= 0)
      throw new BadRequestException('amountCents must be > 0');
    if (amountCents > remainingCents)
      throw new BadRequestException('amount exceeds item due');

    return this.prisma.$transaction(async (tx) => {
      // Create a payment at the invoice level
      const payment = await tx.payment.create({
        data: {
          invoiceId,
          amountCents,
          method: method ?? 'manual',
          reference,
        },
      });

      // Allocate to this item
      await tx.paymentAllocation.create({
        data: {
          paymentId: payment.id,
          invoiceItemId: itemId,
          amountCents,
        },
      });

      // Update item paidCents/status
      const updatedItem = await tx.invoiceItem.update({
        where: { id: itemId },
        data: {
          paidCents: { increment: amountCents },
          status:
            amountCents === remainingCents ? ItemStatus.PAID : ItemStatus.DUE,
          paidAt: amountCents === remainingCents ? new Date() : undefined,
        },
      });

      // Recompute invoice totals from items
      const items = await tx.invoiceItem.findMany({ where: { invoiceId } });
      const totalPaidCents = items.reduce((s, i) => s + (i.paidCents ?? 0), 0);
      const subtotalCents = items.reduce((s, i) => s + i.lineTotalCents, 0);
      const newStatus = items.every((i) => i.status === ItemStatus.PAID)
        ? InvoiceStatus.PAID
        : invoice.dueDate < new Date()
          ? InvoiceStatus.OVERDUE
          : InvoiceStatus.DUE;

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: { paidCents: totalPaidCents, status: newStatus, subtotalCents },
        include: { items: true, payments: true },
      });

      return { invoice: updatedInvoice, updatedItem };
    });
  }
}
