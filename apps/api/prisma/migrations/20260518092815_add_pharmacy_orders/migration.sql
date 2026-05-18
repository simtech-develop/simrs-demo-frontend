-- CreateEnum
CREATE TYPE "PharmacyOrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'COMPLETED', 'CANCELED');

-- CreateTable
CREATE TABLE "PharmacyOrder" (
    "id" TEXT NOT NULL,
    "status" "PharmacyOrderStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "registrationId" TEXT NOT NULL,

    CONSTRAINT "PharmacyOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PharmacyOrderItem" (
    "id" TEXT NOT NULL,
    "medicineName" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "quantity" TEXT NOT NULL,
    "instruction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pharmacyOrderId" TEXT NOT NULL,

    CONSTRAINT "PharmacyOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PharmacyOrder_registrationId_key" ON "PharmacyOrder"("registrationId");

-- CreateIndex
CREATE INDEX "PharmacyOrder_registrationId_idx" ON "PharmacyOrder"("registrationId");

-- CreateIndex
CREATE INDEX "PharmacyOrder_status_idx" ON "PharmacyOrder"("status");

-- CreateIndex
CREATE INDEX "PharmacyOrderItem_pharmacyOrderId_idx" ON "PharmacyOrderItem"("pharmacyOrderId");

-- AddForeignKey
ALTER TABLE "PharmacyOrder" ADD CONSTRAINT "PharmacyOrder_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyOrderItem" ADD CONSTRAINT "PharmacyOrderItem_pharmacyOrderId_fkey" FOREIGN KEY ("pharmacyOrderId") REFERENCES "PharmacyOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
