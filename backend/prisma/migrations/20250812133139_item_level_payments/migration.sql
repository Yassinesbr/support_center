-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('DUE', 'PAID', 'WAIVED');

-- AlterTable
ALTER TABLE "InvoiceItem" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paidCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "ItemStatus" NOT NULL DEFAULT 'DUE';

-- CreateTable
CREATE TABLE "PaymentAllocation" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "invoiceItemId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,

    CONSTRAINT "PaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentAllocation_invoiceItemId_idx" ON "PaymentAllocation"("invoiceItemId");

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_invoiceItemId_fkey" FOREIGN KEY ("invoiceItemId") REFERENCES "InvoiceItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
