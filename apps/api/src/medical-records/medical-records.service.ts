import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  RegistrationStatus,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';

@Injectable()
export class MedicalRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createMedicalRecordDto: CreateMedicalRecordDto) {
    await this.ensureRegistrationExists(createMedicalRecordDto.registrationId);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const medicalRecord = await tx.medicalRecord.create({
          data: createMedicalRecordDto,
          include: this.medicalRecordInclude(),
        });

        await tx.registration.update({
          where: {
            id: createMedicalRecordDto.registrationId,
          },
          data: {
            status: RegistrationStatus.COMPLETED,
          },
        });

        return medicalRecord;
      });
    } catch (error) {
      this.handlePrismaUniqueConstraint(error);
      throw error;
    }
  }

  findAll() {
    return this.prisma.medicalRecord.findMany({
      include: this.medicalRecordInclude(),
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const medicalRecord = await this.prisma.medicalRecord.findUnique({
      where: { id },
      include: this.medicalRecordInclude(),
    });

    if (!medicalRecord) {
      throw new NotFoundException(
        `Medical record with ID ${id} not found`,
      );
    }

    return medicalRecord;
  }

  async findByRegistration(registrationId: string) {
    const medicalRecord = await this.prisma.medicalRecord.findUnique({
      where: {
        registrationId,
      },
      include: this.medicalRecordInclude(),
    });

    if (!medicalRecord) {
      throw new NotFoundException(
        `Medical record for registration ID ${registrationId} not found`,
      );
    }

    return medicalRecord;
  }

  async update(
    id: string,
    updateMedicalRecordDto: UpdateMedicalRecordDto,
  ) {
    await this.findOne(id);

    return this.prisma.medicalRecord.update({
      where: { id },
      data: updateMedicalRecordDto,
      include: this.medicalRecordInclude(),
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.medicalRecord.delete({
      where: { id },
    });
  }

  private async ensureRegistrationExists(registrationId: string) {
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
    });

    if (!registration) {
      throw new NotFoundException(
        `Registration with ID ${registrationId} not found`,
      );
    }
  }

  private medicalRecordInclude() {
    return {
      registration: {
        include: {
          patient: true,
          clinic: true,
          doctor: {
            include: {
              clinic: true,
            },
          },
        },
      },
    };
  }

  private handlePrismaUniqueConstraint(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'Rekam medis untuk registrasi ini sudah dibuat',
      );
    }
  }
}
