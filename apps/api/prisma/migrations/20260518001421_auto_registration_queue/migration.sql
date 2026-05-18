/*
  Warnings:

  - A unique constraint covering the columns `[clinicId,visitDate,queueNumber]` on the table `Registration` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Registration_clinicId_visitDate_queueNumber_key" ON "Registration"("clinicId", "visitDate", "queueNumber");
