import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { PdfService } from './pdf.service';
import { InvoiceStatus } from '@prisma/client';

function monthRange(month?: string) {
  const now = new Date();
  const [y, m] = month
    ? month.split('-').map(Number)
    : [now.getUTCFullYear(), now.getUTCMonth() + 1];
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
  return { start, end };
}

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private pdf: PdfService,
  ) {}

  private async updateStudentPaymentStatusForCurrentMonth(studentId: string) {
    const { start, end } = monthRange();
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        studentId,
        items: { some: { billedMonth: { gte: start, lt: end } } },
      },
      include: { items: true },
    });

    let status: 'paid' | 'partial' | 'unpaid' = 'unpaid';
    if (invoice && invoice.items.length > 0) {
      const total = invoice.items.reduce((s, i) => s + i.lineTotalCents, 0);
      const paid = invoice.items.reduce((s, i) => s + (i.paidCents ?? 0), 0);
      status =
        paid >= total && total > 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid';
    }

    await this.prisma.student.update({
      where: { id: studentId },
      data: { paymentStatus: status },
    });
  }

  async listInvoices({ studentId }: { studentId?: string }) {
    return this.prisma.invoice.findMany({
      where: { studentId: studentId || undefined },
      orderBy: { issueDate: 'desc' },
      include: {
        student: { include: { user: true } },
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

  async generateMonthlyInvoices(month: string) {
    const { start, end } = monthRange(month);
    const dueDate = new Date(start);
    dueDate.setUTCDate(dueDate.getUTCDate() + 10);

    const students = await this.prisma.student.findMany({
      include: { classes: true },
    });

    const results: any[] = [];

    for (const s of students) {
      if (!s.classes.length) {
        await this.updateStudentPaymentStatusForCurrentMonth(s.id);
        continue;
      }

      const number = `INV-${s.id}-${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`;
      const existing = await this.prisma.invoice.findUnique({
        where: { number },
        select: { id: true, number: true },
      });

      if (existing) {
        results.push({
          studentId: s.id,
          number: existing.number,
          skipped: true,
        });
        await this.updateStudentPaymentStatusForCurrentMonth(s.id);
        continue;
      }

      const items = s.classes.map((c) => ({
        classId: c.id,
        billedMonth: start,
        description: `${c.name} - ${start.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
        quantity: 1,
        unitPriceCents: c.monthlyPriceCents ?? 0,
        lineTotalCents: c.monthlyPriceCents ?? 0,
        status: 'DUE' as const,
        paidCents: 0,
      }));

      const subtotal = items.reduce((t, i) => t + i.lineTotalCents, 0);

      const created = await this.prisma.invoice.create({
        data: {
          number,
          studentId: s.id,
          issueDate: new Date(),
          dueDate,
          status: InvoiceStatus.DUE,
          subtotalCents: subtotal,
          paidCents: 0,
          items: { create: items },
        },
      });

      await this.updateStudentPaymentStatusForCurrentMonth(s.id);
      results.push({ studentId: s.id, number: created.number });
    }

    return { month, created: results };
  }

  async ensureUpcomingInvoiceForStudent(studentId: string) {
    const { start, end } = monthRange();
    const dueDate = new Date(start);
    dueDate.setUTCDate(dueDate.getUTCDate() + 10);

    // Get student with classes and price overrides
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        classes: true,
        classPriceOverrides: true, // Include price overrides for this student
      },
    });

    if (!student || student.classes.length === 0) {
      await this.updateStudentPaymentStatusForCurrentMonth(studentId);
      return;
    }

    // Create a map of price overrides for easier lookup
    const priceOverridesMap = new Map(
      student.classPriceOverrides.map((override) => [
        override.classId,
        override.priceOverrideCents,
      ]),
    );

    // Find existing invoice for this month
    let invoice = await this.prisma.invoice.findFirst({
      where: {
        studentId,
        items: { some: { billedMonth: { gte: start, lt: end } } },
      },
      include: { items: true },
    });

    // Track which classes are already in the invoice
    const existingClassIds = invoice
      ? new Set(invoice.items.map((i) => i.classId))
      : new Set();

    // Get classes that need to be added to invoice
    const classesToAdd = student.classes.filter(
      (c) => !existingClassIds.has(c.id),
    );

    if (!invoice && student.classes.length > 0) {
      // Create a new invoice with all classes
      const items = student.classes.map((c) => {
        // Determine the correct price based on pricing mode and overrides
        let lineTotalCents;

        // Check if there's a student-specific price override
        if (priceOverridesMap.has(c.id)) {
          lineTotalCents = priceOverridesMap.get(c.id);
        }
        // Otherwise use the class pricing model
        else if (c.pricingMode === 'FIXED_TOTAL') {
          // For fixed total pricing, divide the price among students (optional)
          // You could get the student count and divide, or bill the full amount to one student
          lineTotalCents = c.fixedMonthlyPriceCents ?? 0;
        } else {
          // Default per-student pricing
          lineTotalCents = c.monthlyPriceCents ?? 0;
        }

        return {
          classId: c.id,
          billedMonth: start,
          description: `${c.name} - ${start.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
          quantity: 1,
          unitPriceCents: lineTotalCents,
          lineTotalCents: lineTotalCents,
          status: 'DUE' as const,
          paidCents: 0,
        };
      });

      const subtotal = items.reduce((t, i) => t + i.lineTotalCents, 0);
      const number = `INV-${studentId}-${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`;

      // Check if invoice with this number already exists
      invoice = await this.prisma.invoice.findUnique({
        where: { number },
        include: { items: true },
      });

      if (invoice) {
        // Update existing invoice if needed
        invoice = await this.prisma.invoice.update({
          where: { number },
          data: {
            // Update fields as needed
            subtotalCents: subtotal,
          },
          include: { items: true },
        });
      } else {
        // Create new invoice
        invoice = await this.prisma.invoice.create({
          data: {
            number,
            studentId,
            issueDate: new Date(),
            dueDate,
            status: InvoiceStatus.DUE,
            subtotalCents: subtotal,
            paidCents: 0,
            items: { create: items },
          },
          include: { items: true },
        });
      }
    } else if (classesToAdd.length > 0) {
      // If we have an existing invoice but need to add new classes
      // Create a new invoice for just the new classes
      const newInvoiceNumber = `INV-${studentId}-${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}-ADD`;

      // Check if we already have an "additional" invoice
      let additionalInvoice = await this.prisma.invoice.findUnique({
        where: { number: newInvoiceNumber },
        include: { items: true },
      });

      // Create items for the new classes
      const additionalItems = classesToAdd.map((c) => {
        // Determine the correct price based on pricing mode and overrides
        let lineTotalCents;

        if (priceOverridesMap.has(c.id)) {
          lineTotalCents = priceOverridesMap.get(c.id);
        } else if (c.pricingMode === 'FIXED_TOTAL') {
          lineTotalCents = c.fixedMonthlyPriceCents ?? 0;
        } else {
          lineTotalCents = c.monthlyPriceCents ?? 0;
        }

        return {
          classId: c.id,
          billedMonth: start,
          description: `${c.name} - ${start.toLocaleString('default', { month: 'long', year: 'numeric' })} (Additional)`,
          quantity: 1,
          unitPriceCents: lineTotalCents,
          lineTotalCents: lineTotalCents,
          status: 'DUE' as const,
          paidCents: 0,
        };
      });

      const additionalSubtotal = additionalItems.reduce(
        (t, i) => t + i.lineTotalCents,
        0,
      );

      if (additionalInvoice) {
        // Update existing additional invoice
        const existingAdditionalClassIds = new Set(
          additionalInvoice.items.map((i) => i.classId),
        );
        const newAdditionalItems = additionalItems.filter(
          (item) => !existingAdditionalClassIds.has(item.classId),
        );

        if (newAdditionalItems.length > 0) {
          await this.prisma.invoiceItem.createMany({
            data: newAdditionalItems.map((item) => ({
              // Use the non-null assertion operator here
              invoiceId: additionalInvoice!.id,
              ...item,
            })),
          });

          additionalInvoice = await this.prisma.invoice.update({
            where: { id: additionalInvoice.id },
            data: {
              subtotalCents:
                additionalInvoice.subtotalCents +
                newAdditionalItems.reduce((t, i) => t + i.lineTotalCents, 0),
            },
            include: { items: true },
          });
        }
      } else if (additionalItems.length > 0) {
        // Create new additional invoice
        additionalInvoice = await this.prisma.invoice.create({
          data: {
            number: newInvoiceNumber,
            studentId,
            issueDate: new Date(),
            dueDate,
            status: InvoiceStatus.DUE,
            subtotalCents: additionalSubtotal,
            paidCents: 0,
            items: { create: additionalItems },
          },
          include: { items: true },
        });
      }
    }

    await this.updateStudentPaymentStatusForCurrentMonth(studentId);
    return invoice;
  }

  async payInvoice(
    id: string,
    dto: { amountCents?: number; method?: string; reference?: string },
  ) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const remainingByItem = invoice.items.map((i) => ({
      id: i.id,
      due: i.lineTotalCents - (i.paidCents ?? 0),
    }));
    const totalRemaining = remainingByItem.reduce((s, r) => s + r.due, 0);
    if (totalRemaining <= 0) {
      await this.updateStudentPaymentStatusForCurrentMonth(invoice.studentId);
      return this.getInvoice(id);
    }

    const payAmount =
      dto.amountCents == null ? totalRemaining : dto.amountCents;
    if (payAmount <= 0) throw new BadRequestException('Nothing to pay');
    if (payAmount > totalRemaining)
      throw new BadRequestException('Amount exceeds remaining due');

    const method = dto.method ?? 'manual';
    const reference = dto.reference;

    const updated = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          amountCents: payAmount,
          method,
          reference,
        },
      });

      let left = payAmount;
      for (const item of invoice.items) {
        if (left <= 0) break;
        const itemDue = item.lineTotalCents - (item.paidCents ?? 0);
        if (itemDue <= 0) continue;
        const alloc = Math.min(left, itemDue);

        await tx.paymentAllocation.create({
          data: {
            paymentId: payment.id,
            invoiceItemId: item.id,
            amountCents: alloc,
          },
        });

        await tx.invoiceItem.update({
          where: { id: item.id },
          data: {
            paidCents: (item.paidCents ?? 0) + alloc,
            status: alloc === itemDue ? ('PAID' as const) : ('DUE' as const),
            paidAt: alloc === itemDue ? new Date() : (item.paidAt ?? undefined),
          },
        });

        left -= alloc;
      }

      const items = await tx.invoiceItem.findMany({
        where: { invoiceId: invoice.id },
      });
      const subtotal = items.reduce((s, i) => s + i.lineTotalCents, 0);
      const paid = items.reduce((s, i) => s + (i.paidCents ?? 0), 0);
      const allPaid = items.every((i) => i.status === 'PAID');

      return tx.invoice.update({
        where: { id: invoice.id },
        data: {
          subtotalCents: subtotal,
          paidCents: paid,
          status: allPaid
            ? InvoiceStatus.PAID
            : invoice.dueDate < new Date()
              ? InvoiceStatus.OVERDUE
              : InvoiceStatus.DUE,
        },
        include: { items: true, payments: true, student: true },
      });
    });

    await this.updateStudentPaymentStatusForCurrentMonth(updated.studentId);
    return updated;
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
      include: { items: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const item = invoice.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException('Invoice item not found');

    const remainingCents = item.lineTotalCents - (item.paidCents ?? 0);
    if (remainingCents <= 0) return this.getInvoice(invoiceId);
    if (amountCents <= 0)
      throw new BadRequestException('amountCents must be > 0');
    if (amountCents > remainingCents)
      throw new BadRequestException('amount exceeds item due');

    const updated = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: { invoiceId, amountCents, method: method ?? 'manual', reference },
      });

      await tx.paymentAllocation.create({
        data: { paymentId: payment.id, invoiceItemId: itemId, amountCents },
      });

      await tx.invoiceItem.update({
        where: { id: itemId },
        data: {
          paidCents: (item.paidCents ?? 0) + amountCents,
          status:
            amountCents === remainingCents
              ? ('PAID' as const)
              : ('DUE' as const),
          paidAt:
            amountCents === remainingCents
              ? new Date()
              : (item.paidAt ?? undefined),
        },
      });

      const items = await tx.invoiceItem.findMany({ where: { invoiceId } });
      const subtotal = items.reduce((s, i) => s + i.lineTotalCents, 0);
      const paid = items.reduce((s, i) => s + (i.paidCents ?? 0), 0);
      const allPaid = items.every((i) => i.status === 'PAID');

      return tx.invoice.update({
        where: { id: invoiceId },
        data: {
          subtotalCents: subtotal,
          paidCents: paid,
          status: allPaid
            ? InvoiceStatus.PAID
            : invoice.dueDate < new Date()
              ? InvoiceStatus.OVERDUE
              : InvoiceStatus.DUE,
        },
        include: { items: true, payments: true, student: true },
      });
    });

    await this.updateStudentPaymentStatusForCurrentMonth(updated.studentId);
    return updated;
  }

  async generatePdf(id: string) {
    const inv = await this.getInvoice(id);
    const buffer = await this.pdf.invoice(inv);
    return { buffer, filename: `${inv.number}.pdf` };
  }
}
