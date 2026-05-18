import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { ClinicsModule } from './clinics/clinics.module';
import { PrismaModule } from './prisma/prisma.module';
import { DoctorsModule } from './doctors/doctors.module';
import { PatientsModule } from './patients/patients.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { MedicalRecordsModule } from './medical-records/medical-records.module';
import { PharmacyOrdersModule } from './pharmacy-orders/pharmacy-orders.module';
import { CashierBillsModule } from './cashier-bills/cashier-bills.module';
import { EmergencyAssessmentsModule } from './emergency-assessments/emergency-assessments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    ClinicsModule,
    DoctorsModule,
    PatientsModule,
    RegistrationsModule,
    MedicalRecordsModule,
    PharmacyOrdersModule,
    CashierBillsModule,
    EmergencyAssessmentsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
