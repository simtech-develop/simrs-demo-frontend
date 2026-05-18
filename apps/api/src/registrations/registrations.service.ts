import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';

@Injectable()
export class RegistrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRegistrationDto: CreateRegistrationDto) {
    const visitDate = new Date(createRegistrationDto.visitDate);

    await this.ensurePatientExists(createRegistrationDto.patientId);
    await this.ensureClinicExists(createRegistrationDto.clinicId);

    if (createRegistrationDto.doctorId) {
      await this.ensureDoctorMatchesClinic(
        createRegistrationDto.doctorId,
        createRegistrationDto.clinicId,
      );
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const totalRegistrationsOnDate = await tx.registration.count({
          where: {
            visitDate,
          },
        });

        const totalQueueInClinic = await tx.registration.count({
          where: {
            visitDate,
            clinicId: createRegistrationDto.clinicId,
          },
        });

        const sequenceNumber = totalRegistrationsOnDate + 1;
        const queueNumber = totalQueueInClinic + 1;

        const registrationNo = this.generateRegistrationNo(
          createRegistrationDto.visitDate,
          sequenceNumber,
        );

        return tx.registration.create({
          data: {
            registrationNo,
            visitDate,
            queueNumber,
            chiefComplaint: createRegistrationDto.chiefComplaint,
            patientId: createRegistrationDto.patientId,
            clinicId: createRegistrationDto.clinicId,
            doctorId: createRegistrationDto.doctorId,
          },
          include: this.registrationInclude(),
        });
      });
    } catch (error) {
      this.handlePrismaUniqueConstraint(error);
      throw error;
    }
  }

  findAll() {
    return this.prisma.registration.findMany({
      include: this.registrationInclude(),
      orderBy: [
        {
          visitDate: 'desc',
        },
        {
          queueNumber: 'asc',
        },
      ],
    });
  }

  async findOne(id: string) {
    const registration = await this.prisma.registration.findUnique({
      where: { id },
      include: this.registrationInclude(),
    });

    if (!registration) {
      throw new NotFoundException(
        `Registration with ID ${id} not found`,
      );
    }

    return registration;
  }

  async update(
    id: string,
    updateRegistrationDto: UpdateRegistrationDto,
  ) {
    const existingRegistration = await this.findOne(id);

    if (updateRegistrationDto.doctorId) {
      await this.ensureDoctorMatchesClinic(
        updateRegistrationDto.doctorId,
        existingRegistration.clinicId,
      );
    }

    return this.prisma.registration.update({
      where: { id },
      data: updateRegistrationDto,
      include: this.registrationInclude(),
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.registration.delete({
      where: { id },
    });
  }

  private generateRegistrationNo(
    visitDate: string,
    sequenceNumber: number,
  ): string {
    const datePart = visitDate.replace(/-/g, '');
    const sequencePart = String(sequenceNumber).padStart(4, '0');

    return `REG-${datePart}-${sequencePart}`;
  }

  private registrationInclude() {
    return {
      patient: true,
      clinic: true,
      doctor: {
        include: {
          clinic: true,
        },
      },
    };
  }

  private async ensurePatientExists(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }
  }

  private async ensureClinicExists(clinicId: string) {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
    });

    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${clinicId} not found`);
    }
  }

  private async ensureDoctorMatchesClinic(
    doctorId: string,
    clinicId: string,
  ) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
    }

    if (doctor.clinicId !== clinicId) {
      throw new BadRequestException(
        'Dokter tidak terdaftar pada poli yang dipilih',
      );
    }
  }

  private handlePrismaUniqueConstraint(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'Nomor registrasi atau nomor antrean sudah digunakan. Silakan ulangi proses registrasi.',
      );
    }
  }
}
