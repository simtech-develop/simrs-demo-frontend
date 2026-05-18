-- CreateEnum
CREATE TYPE "CashierBillStatus" AS ENUM ('UNPAID', 'PAID', 'CANCELED');

-- CreateTable
CREATE TABLE "CashierBill" (
    "id" TEXT NOT NULL,
    "billNo" TEXT NOT NULL,
    "status" "CashierBillStatus" NOT NULL DEFAULT 'UNPAID',
    "totalAmount" INTEGER NOT NULL,
    "paidAmount" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "registrationId" TEXT NOT NULL,

    CONSTRAINT "CashierBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashierBillItem" (
    "id" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cashierBillId" TEXT NOT NULL,

    CONSTRAINT "CashierBillItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CashierBill_billNo_key" ON "CashierBill"("billNo");

-- CreateIndex
CREATE UNIQUE INDEX "CashierBill_registrationId_key" ON "CashierBill"("registrationId");

-- CreateIndex
CREATE INDEX "CashierBill_registrationId_idx" ON "CashierBill"("registrationId");

-- CreateIndex
CREATE INDEX "CashierBill_status_idx" ON "CashierBill"("status");

-- CreateIndex
CREATE INDEX "CashierBillItem_cashierBillId_idx" ON "CashierBillItem"("cashierBillId");

-- AddForeignKey
ALTER TABLE "CashierBill" ADD CONSTRAINT "CashierBill_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashierBillItem" ADD CONSTRAINT "CashierBillItem_cashierBillId_fkey" FOREIGN KEY ("cashierBillId") REFERENCES "CashierBill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
