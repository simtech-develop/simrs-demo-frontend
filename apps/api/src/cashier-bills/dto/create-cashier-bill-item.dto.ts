import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCashierBillItemDto {
  @ApiProperty({
    example: 'Pemeriksaan Poli Umum',
    description: 'Nama item tagihan',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  itemName: string;

  @ApiProperty({
    example: 'SERVICE',
    description: 'Jenis item tagihan: REGISTRATION, SERVICE, PHARMACY',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  itemType: string;

  @ApiProperty({
    example: 1,
    description: 'Jumlah item',
  })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    example: 75000,
    description: 'Harga satuan item',
  })
  @IsInt()
  @Min(0)
  unitPrice: number;
}
