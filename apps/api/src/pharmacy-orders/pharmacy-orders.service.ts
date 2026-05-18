import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePharmacyOrderDto } from './dto/create-pharmacy-order.dto';
import { UpdatePharmacyOrderStatusDto } from './dto/update-pharmacy-order-status.dto';

@Injectable()
export class PharmacyOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPharmacyOrderDto: CreatePharmacyOrderDto) {
    await this.ensureRegistrationExists(
      createPharmacyOrderDto.registrationId,
    );

    try {
      return await this.prisma.pharmacyOrder.create({
        data: {
          registrationId: createPharmacyOrderDto.registrationId,
          note: createPharmacyOrderDto.note,
          items: {
            create: createPharmacyOrderDto.items,
          },
        },
        include: this.pharmacyOrderInclude(),
      });
    } catch (error) {
      this.handlePrismaUniqueConstraint(error);
      throw error;
    }
  }

  findAll() {
    return this.prisma.pharmacyOrder.findMany({
      include: this.pharmacyOrderInclude(),
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const pharmacyOrder = await this.prisma.pharmacyOrder.findUnique({
      where: { id },
      include: this.pharmacyOrderInclude(),
    });

    if (!pharmacyOrder) {
      throw new NotFoundException(
        `Pharmacy order with ID ${id} not found`,
      );
    }

    return pharmacyOrder;
  }

  async findByRegistration(registrationId: string) {
    const pharmacyOrder = await this.prisma.pharmacyOrder.findUnique({
      where: {
        registrationId,
      },
      include: this.pharmacyOrderInclude(),
    });

    if (!pharmacyOrder) {
      throw new NotFoundException(
        `Pharmacy order for registration ID ${registrationId} not found`,
      );
    }

    return pharmacyOrder;
  }

  async updateStatus(
    id: string,
    updatePharmacyOrderStatusDto: UpdatePharmacyOrderStatusDto,
  ) {
    await this.findOne(id);

    return this.prisma.pharmacyOrder.update({
      where: { id },
      data: {
        status: updatePharmacyOrderStatusDto.status,
      },
      include: this.pharmacyOrderInclude(),
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.pharmacyOrder.delete({
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

  private pharmacyOrderInclude() {
    return {
      items: true,
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
        'Order farmasi untuk registrasi ini sudah dibuat',
      );
    }
  }
}
