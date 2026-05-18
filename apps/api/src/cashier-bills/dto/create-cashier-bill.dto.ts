import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCashierBillItemDto } from './create-cashier-bill-item.dto';

export class CreateCashierBillDto {
  @ApiProperty({
    example: 'cmpajbp0h0001sv3yd0ouloze',
    description: 'ID registrasi pasien',
  })
  @IsString()
  @IsNotEmpty()
  registrationId: string;

  @ApiPropertyOptional({
    example: 'Tagihan rawat jalan pasien.',
    description: 'Catatan tambahan bill kasir',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;

  @ApiProperty({
    type: [CreateCashierBillItemDto],
    description: 'Daftar item tagihan',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateCashierBillItemDto)
  items: CreateCashierBillItemDto[];
}
