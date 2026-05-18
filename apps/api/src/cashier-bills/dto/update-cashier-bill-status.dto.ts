import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { CashierBillStatus } from '../../generated/prisma/client';

export class UpdateCashierBillStatusDto {
  @ApiProperty({
    enum: CashierBillStatus,
    example: CashierBillStatus.PAID,
    description: 'Status pembayaran bill kasir',
  })
  @IsEnum(CashierBillStatus)
  status: CashierBillStatus;

  @ApiPropertyOptional({
    example: 135000,
    description: 'Nominal yang dibayarkan pasien',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  paidAmount?: number;
}
