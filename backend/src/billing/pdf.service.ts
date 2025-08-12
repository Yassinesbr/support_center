import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
@Injectable()
export class PdfService {
  async invoice(inv: any): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      const studentName =
        `${inv.student?.user?.firstName ?? ''} ${inv.student?.user?.lastName ?? ''}`.trim();

      doc.fontSize(20).text('Invoice', { align: 'right' });
      doc
        .moveDown()
        .fontSize(12)
        .text(`Invoice #: ${inv.number}`)
        .text(`Issue Date: ${new Date(inv.issueDate).toLocaleDateString()}`)
        .text(`Due Date: ${new Date(inv.dueDate).toLocaleDateString()}`)
        .moveDown()
        .text(`Student: ${studentName}`)
        .moveDown()
        .text('Items:')
        .moveDown(0.5);

      inv.items.forEach((it: any) => {
        const price = (it.unitPriceCents / 100).toFixed(2);
        const suffix =
          it.status === 'PAID'
            ? ` (PAID${it.paidAt ? ' ' + new Date(it.paidAt).toLocaleDateString() : ''})`
            : '';
        doc.text(`• ${it.description} — ${price} ${inv.currency}${suffix}`);
      });

      doc
        .moveDown()
        .fontSize(14)
        .text(
          `Total: ${(inv.subtotalCents / 100).toFixed(2)} ${inv.currency}`,
          { align: 'right' },
        );

      doc.end();
    });
  }
}
