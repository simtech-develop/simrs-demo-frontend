-- CreateEnum
CREATE TYPE "EmergencyTriageLevel" AS ENUM ('RED', 'YELLOW', 'GREEN');

-- CreateEnum
CREATE TYPE "EmergencyAssessmentStatus" AS ENUM ('WAITING_TRIAGE', 'IN_ASSESSMENT', 'TRIAGE_COMPLETED');

-- CreateTable
CREATE TABLE "EmergencyAssessment" (
    "id" TEXT NOT NULL,
    "triageLevel" "EmergencyTriageLevel" NOT NULL DEFAULT 'GREEN',
    "chiefComplaint" TEXT,
    "consciousness" TEXT,
    "bloodPressure" TEXT,
    "pulse" TEXT,
    "respiratoryRate" TEXT,
    "oxygenSaturation" TEXT,
    "emergencyNote" TEXT,
    "status" "EmergencyAssessmentStatus" NOT NULL DEFAULT 'WAITING_TRIAGE',
    "assessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "registrationId" TEXT NOT NULL,

    CONSTRAINT "EmergencyAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmergencyAssessment_registrationId_key" ON "EmergencyAssessment"("registrationId");

-- CreateIndex
CREATE INDEX "EmergencyAssessment_registrationId_idx" ON "EmergencyAssessment"("registrationId");

-- CreateIndex
CREATE INDEX "EmergencyAssessment_triageLevel_idx" ON "EmergencyAssessment"("triageLevel");

-- CreateIndex
CREATE INDEX "EmergencyAssessment_status_idx" ON "EmergencyAssessment"("status");

-- AddForeignKey
ALTER TABLE "EmergencyAssessment" ADD CONSTRAINT "EmergencyAssessment_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
