import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPatientDto: CreatePatientDto) {
    try {
      return await this.prisma.patient.create({
        data: {
          ...createPatientDto,
          birthDate: new Date(createPatientDto.birthDate),
        },
      });
    } catch (error) {
      this.handlePrismaUniqueConstraint(error);
      throw error;
    }
  }

  findAll() {
    return this.prisma.patient.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    return patient;
  }

  async update(id: string, updatePatientDto: UpdatePatientDto) {
    await this.findOne(id);

    try {
      return await this.prisma.patient.update({
        where: { id },
        data: {
          ...updatePatientDto,
          ...(updatePatientDto.birthDate
            ? { birthDate: new Date(updatePatientDto.birthDate) }
            : {}),
        },
      });
    } catch (error) {
      this.handlePrismaUniqueConstraint(error);
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.patient.delete({
      where: { id },
    });
  }

  private handlePrismaUniqueConstraint(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const target = error.meta?.target;

      if (Array.isArray(target) && target.includes('medicalRecordNo')) {
        throw new ConflictException('Nomor rekam medis sudah digunakan');
      }

      if (Array.isArray(target) && target.includes('nationalId')) {
        throw new ConflictException('Nomor identitas pasien sudah digunakan');
      }

      throw new ConflictException('Data pasien sudah terdaftar');
    }
  }
}
