import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { PharmacyOrderStatus } from '../../generated/prisma/client';

export class UpdatePharmacyOrderStatusDto {
  @ApiProperty({
    enum: PharmacyOrderStatus,
    example: PharmacyOrderStatus.PROCESSING,
    description: 'Status proses order farmasi',
  })
  @IsEnum(PharmacyOrderStatus)
  status: PharmacyOrderStatus;
}
