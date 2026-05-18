import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@Injectable()
export class DoctorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDoctorDto: CreateDoctorDto) {
    if (createDoctorDto.clinicId) {
      await this.ensureClinicExists(createDoctorDto.clinicId);
    }

    try {
      return await this.prisma.doctor.create({
        data: createDoctorDto,
        include: {
          clinic: true,
        },
      });
    } catch (error) {
      this.handlePrismaUniqueConstraint(error);
      throw error;
    }
  }

  findAll() {
    return this.prisma.doctor.findMany({
      include: {
        clinic: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: {
        clinic: true,
      },
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    return doctor;
  }

  async update(id: string, updateDoctorDto: UpdateDoctorDto) {
    await this.findOne(id);

    if (updateDoctorDto.clinicId) {
      await this.ensureClinicExists(updateDoctorDto.clinicId);
    }

    try {
      return await this.prisma.doctor.update({
        where: { id },
        data: updateDoctorDto,
        include: {
          clinic: true,
        },
      });
    } catch (error) {
      this.handlePrismaUniqueConstraint(error);
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.doctor.delete({
      where: { id },
    });
  }

  private async ensureClinicExists(clinicId: string) {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
    });

    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${clinicId} not found`);
    }
  }

  private handlePrismaUniqueConstraint(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Kode dokter sudah digunakan');
    }
  }
}
