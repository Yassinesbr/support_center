import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
@Injectable()
export class PdfService {
  async invoice(inv: any): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ size: 'A4', margin: 25 }); // smaller margin
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Helper to draw one invoice copy at vertical offset
      const drawInvoice = (offsetY: number) => {
        // Layout helpers
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const pageMargin = doc.page.margins.left;
        const contentWidth = pageWidth - pageMargin * 2;
        let cursorY = offsetY + 20;

        // Header
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('Support Center', pageMargin, cursorY);
        cursorY += 18;
        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#666666')
          .text('123 Learning St, Casablanca, Morocco', pageMargin, cursorY);
        cursorY += 10;
        doc.text('support@example.com • +212 600 000 000', pageMargin, cursorY);
        cursorY += 6;
        doc.text('www.support-center.example', pageMargin, cursorY);
        doc.fillColor('#000000');

        // Invoice title and meta box
        cursorY += 12;
        doc
          .fontSize(16)
          .font('Helvetica-Bold')
          .text('INVOICE', pageMargin, cursorY);
        doc.font('Helvetica');

        // Meta on the right
        const metaX = pageMargin + contentWidth / 2 + 20;
        const metaY = cursorY;
        doc
          .fontSize(8)
          .text(`Invoice #: ${inv.number}`, metaX, metaY, {
            width: contentWidth / 2 - 20,
            align: 'right',
          })
          .moveDown(0.2)
          .text(
            `Issue Date: ${new Date(inv.issueDate).toLocaleDateString()}`,
            metaX,
            doc.y,
            {
              width: contentWidth / 2 - 20,
              align: 'right',
            },
          )
          .moveDown(0.2)
          .text(
            `Due Date: ${new Date(inv.dueDate).toLocaleDateString()}`,
            metaX,
            doc.y,
            {
              width: contentWidth / 2 - 20,
              align: 'right',
            },
          )
          .moveDown(0.2)
          .text(`Status: ${inv.status}`, metaX, doc.y, {
            width: contentWidth / 2 - 20,
            align: 'right',
          });

        // Bill To
        cursorY += 16;
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Bill To', pageMargin, cursorY);
        cursorY += 10;
        doc
          .fontSize(8)
          .font('Helvetica')
          .text(
            `${inv.student?.user?.firstName ?? ''} ${inv.student?.user?.lastName ?? ''}`.trim() ||
              'Student',
            pageMargin,
            cursorY,
          );
        cursorY += 10;
        if (inv.student?.user?.email) {
          doc.text(inv.student.user.email, pageMargin, cursorY);
          cursorY += 10;
        }

        // Items table header
        cursorY += 6;
        const tableX = pageMargin;
        const tableY = cursorY;
        const colDescW = Math.floor(contentWidth * 0.44);
        const colQtyW = Math.floor(contentWidth * 0.1);
        const colUnitW = Math.floor(contentWidth * 0.18);
        const colTotalW = Math.floor(contentWidth * 0.14);
        const colStatusW = Math.floor(contentWidth * 0.14);

        doc
          .lineWidth(1)
          .moveTo(tableX, tableY)
          .lineTo(tableX + contentWidth, tableY)
          .strokeColor('#E5E7EB')
          .stroke()
          .strokeColor('#000000');

        cursorY += 4;
        doc.font('Helvetica-Bold').fontSize(8);
        doc.text('Description', tableX + 2, cursorY, { width: colDescW });
        doc.text('Qty', tableX + 2 + colDescW, cursorY, {
          width: colQtyW,
          align: 'right',
        });
        doc.text('Unit Price', tableX + 2 + colDescW + colQtyW, cursorY, {
          width: colUnitW,
          align: 'right',
        });
        doc.text(
          'Line Total',
          tableX + 2 + colDescW + colQtyW + colUnitW,
          cursorY,
          {
            width: colTotalW,
            align: 'right',
          },
        );
        doc.text(
          'Status',
          tableX + 2 + colDescW + colQtyW + colUnitW + colTotalW,
          cursorY,
          {
            width: colStatusW,
            align: 'right',
          },
        );
        cursorY += 12;

        doc
          .lineWidth(1)
          .moveTo(tableX, cursorY)
          .lineTo(tableX + contentWidth, cursorY)
          .strokeColor('#E5E7EB')
          .stroke()
          .strokeColor('#000000');

        // Items rows
        doc.font('Helvetica').fontSize(8);
        cursorY += 6;

        inv.items?.forEach((it: any) => {
          const desc = it.description || it.class?.name || 'Class';
          const qty = it.quantity ?? 1;
          const unit = `${(Number(it.unitPriceCents || it.lineTotalCents || 0) / 100).toFixed(2)} ${inv.currency ?? 'MAD'}`;
          const lineTotal = `${(Number(it.lineTotalCents || 0) / 100).toFixed(2)} ${inv.currency ?? 'MAD'}`;
          const status = it.status ?? 'DUE';

          const rowHeight = 12;
          // Description might wrap
          const descHeight = doc.heightOfString(desc, { width: colDescW });
          const rowH = Math.max(rowHeight, descHeight + 2);

          doc.text(desc, tableX + 2, cursorY, { width: colDescW });
          doc.text(String(qty), tableX + 2 + colDescW, cursorY, {
            width: colQtyW,
            align: 'right',
          });
          doc.text(unit, tableX + 2 + colDescW + colQtyW, cursorY, {
            width: colUnitW,
            align: 'right',
          });
          doc.text(
            lineTotal,
            tableX + 2 + colDescW + colQtyW + colUnitW,
            cursorY,
            {
              width: colTotalW,
              align: 'right',
            },
          );
          doc.text(
            status,
            tableX + 2 + colDescW + colQtyW + colUnitW + colTotalW,
            cursorY,
            {
              width: colStatusW,
              align: 'right',
            },
          );

          cursorY += rowH;
          doc
            .moveTo(tableX, cursorY + 4)
            .lineTo(tableX + contentWidth, cursorY + 4)
            .strokeColor('#F3F4F6')
            .stroke()
            .strokeColor('#000000');
          cursorY += 6;
        });

        // Totals box
        const totalsBoxW = 160;
        const totalsX = pageMargin + contentWidth - totalsBoxW;
        let totalsY = cursorY + 6;

        // Box border
        doc
          .roundedRect(totalsX, totalsY, totalsBoxW, 60, 4)
          .strokeColor('#E5E7EB')
          .stroke()
          .strokeColor('#000000');

        const labelColW = 80;
        const valueColW = totalsBoxW - labelColW - 16; // paddings

        totalsY += 6;
        doc.font('Helvetica').fontSize(8).fillColor('#111827');

        // Subtotal
        doc.text('Subtotal:', totalsX + 8, totalsY, {
          width: labelColW,
          align: 'left',
        });
        doc.text(
          `${(Number(inv.subtotalCents || 0) / 100).toFixed(2)} ${inv.currency ?? 'MAD'}`,
          totalsX + 8 + labelColW,
          totalsY,
          {
            width: valueColW,
            align: 'right',
          },
        );
        totalsY += 12;

        // Payments
        doc.text('Payments:', totalsX + 8, totalsY, {
          width: labelColW,
          align: 'left',
        });
        doc.text(
          `- ${(Number(inv.paidCents || 0) / 100).toFixed(2)} ${inv.currency ?? 'MAD'}`,
          totalsX + 8 + labelColW,
          totalsY,
          {
            width: valueColW,
            align: 'right',
          },
        );
        totalsY += 12;

        // Balance Due
        doc.font('Helvetica-Bold');
        doc.text('Balance Due:', totalsX + 8, totalsY, {
          width: labelColW,
          align: 'left',
        });
        doc.text(
          `${(Math.max(0, (inv.subtotalCents || 0) - (inv.paidCents || 0)) / 100).toFixed(2)} ${inv.currency ?? 'MAD'}`,
          totalsX + 8 + labelColW,
          totalsY,
          {
            width: valueColW,
            align: 'right',
          },
        );
        doc.font('Helvetica');
        totalsY += 18;

        // Notes (if any)
        if (inv.notes) {
          doc
            .fontSize(8)
            .fillColor('#6B7280')
            .text('Notes', pageMargin, cursorY + 6);
          doc.fillColor('#111827').text(inv.notes, pageMargin, cursorY + 16, {
            width: contentWidth - totalsBoxW - 10,
          });
          doc.fillColor('#000000');
        }

        // Footer
        const footerY = offsetY + pageHeight / 2 - 60;
        doc
          .fontSize(7)
          .fillColor('#6B7280')
          .text(
            'Contact us: +212 600 000 000 • +212 611 111 111',
            pageMargin,
            footerY,
            { width: contentWidth, align: 'center' },
          )
          .moveDown(0.2)
          .text(
            'Address: 123 Learning St, Casablanca, Morocco • Email: support@example.com',
            pageMargin,
            doc.y,
            { width: contentWidth, align: 'center' },
          )
          .fillColor('#000000');
      };

      // Draw first copy (top half)
      drawInvoice(0);

      // Draw second copy (bottom half)
      drawInvoice(doc.page.height / 2);
      // Add a horizontal dotted line between the two copies
      const lineY = doc.page.height / 2;
      const leftX = 25; // left margin
      const rightX = doc.page.width - 25; // right margin
      doc
        .lineWidth(1)
        .dash(4, { space: 4 }) // 4pt dash, 4pt space
        .moveTo(leftX, lineY)
        .lineTo(rightX, lineY)
        .strokeColor('#888888')
        .stroke()
        .undash();

      doc.end();
    });
  }
}
