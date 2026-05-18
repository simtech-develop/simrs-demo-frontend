import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';

@Injectable()
export class ClinicsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createClinicDto: CreateClinicDto) {
    try {
      return await this.prisma.clinic.create({
        data: createClinicDto,
      });
    } catch (error) {
      this.handlePrismaUniqueConstraint(error);
      throw error;
    }
  }

  findAll() {
    return this.prisma.clinic.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id },
    });

    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${id} not found`);
    }

    return clinic;
  }

  async update(id: string, updateClinicDto: UpdateClinicDto) {
    await this.findOne(id);

    try {
      return await this.prisma.clinic.update({
        where: { id },
        data: updateClinicDto,
      });
    } catch (error) {
      this.handlePrismaUniqueConstraint(error);
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.clinic.delete({
      where: { id },
    });
  }

  private handlePrismaUniqueConstraint(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Kode poli sudah digunakan');
    }
  }
}
