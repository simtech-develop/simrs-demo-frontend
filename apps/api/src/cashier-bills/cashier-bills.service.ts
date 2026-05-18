import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCashierBillDto } from './dto/create-cashier-bill.dto';
import { UpdateCashierBillStatusDto } from './dto/update-cashier-bill-status.dto';

@Injectable()
export class CashierBillsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCashierBillDto: CreateCashierBillDto) {
    await this.ensureRegistrationExists(createCashierBillDto.registrationId);

    const items = createCashierBillDto.items.map((item) => ({
      ...item,
      subtotal: item.quantity * item.unitPrice,
    }));

    const totalAmount = items.reduce(
      (total, item) => total + item.subtotal,
      0,
    );

    const billNo = await this.generateBillNo();

    try {
      return await this.prisma.cashierBill.create({
        data: {
          billNo,
          registrationId: createCashierBillDto.registrationId,
          note: createCashierBillDto.note,
          totalAmount,
          items: {
            create: items,
          },
        },
        include: this.cashierBillInclude(),
      });
    } catch (error) {
      this.handlePrismaUniqueConstraint(error);
      throw error;
    }
  }

  findAll() {
    return this.prisma.cashierBill.findMany({
      include: this.cashierBillInclude(),
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const bill = await this.prisma.cashierBill.findUnique({
      where: { id },
      include: this.cashierBillInclude(),
    });

    if (!bill) {
      throw new NotFoundException(`Cashier bill with ID ${id} not found`);
    }

    return bill;
  }

  async findByRegistration(registrationId: string) {
    const bill = await this.prisma.cashierBill.findUnique({
      where: {
        registrationId,
      },
      include: this.cashierBillInclude(),
    });

    if (!bill) {
      throw new NotFoundException(
        `Cashier bill for registration ID ${registrationId} not found`,
      );
    }

    return bill;
  }

  async updateStatus(
    id: string,
    updateCashierBillStatusDto: UpdateCashierBillStatusDto,
  ) {
    const bill = await this.findOne(id);

    const paidAmount =
      updateCashierBillStatusDto.paidAmount ?? bill.paidAmount;

    if (
      updateCashierBillStatusDto.status === 'PAID' &&
      paidAmount < bill.totalAmount
    ) {
      throw new BadRequestException(
        'Nominal pembayaran belum mencukupi total tagihan',
      );
    }

    return this.prisma.cashierBill.update({
      where: { id },
      data: {
        status: updateCashierBillStatusDto.status,
        paidAmount,
        paidAt:
          updateCashierBillStatusDto.status === 'PAID'
            ? new Date()
            : null,
      },
      include: this.cashierBillInclude(),
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.cashierBill.delete({
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

  private async generateBillNo() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    const datePrefix = `BILL-${year}${month}${day}`;

    const totalToday = await this.prisma.cashierBill.count({
      where: {
        billNo: {
          startsWith: datePrefix,
        },
      },
    });

    const sequence = String(totalToday + 1).padStart(4, '0');

    return `${datePrefix}-${sequence}`;
  }

  private cashierBillInclude() {
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
        'Tagihan kasir untuk registrasi ini sudah dibuat',
      );
    }
  }
}
