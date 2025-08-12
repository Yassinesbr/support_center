import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Query,
  Res,
  HttpCode,
} from '@nestjs/common';
import { Response } from 'express';
import { InvoicesService } from './invoices.service';

class PayInvoiceDto {
  amountCents!: number;
  method?: string;
  reference?: string;
}
class GenerateInvoicesDto {
  month!: string;
} // '2025-08'

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly svc: InvoicesService) {}

  @Get()
  list(@Query('studentId') studentId?: string) {
    return this.svc.listInvoices({ studentId });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.getInvoice(id);
  }

  @Get(':id/pdf')
  async pdf(@Param('id') id: string, @Res() res: Response) {
    const { buffer, filename } = await this.svc.generatePdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(buffer);
  }

  @Post('generate-monthly')
  generateMonthly(@Body() dto: GenerateInvoicesDto) {
    return this.svc.generateMonthlyInvoices(dto.month);
  }

  @Post(':id/pay')
  @HttpCode(200)
  pay(@Param('id') id: string, @Body() dto: PayInvoiceDto) {
    return this.svc.payInvoice(id, dto);
  }

  @Post(':invoiceId/items/:itemId/pay')
  @HttpCode(200)
  payItem(
    @Param('invoiceId') invoiceId: string,
    @Param('itemId') itemId: string,
    @Body() dto: PayInvoiceDto,
  ) {
    return this.svc.payInvoiceItem({ invoiceId, itemId, ...dto });
  }
}
