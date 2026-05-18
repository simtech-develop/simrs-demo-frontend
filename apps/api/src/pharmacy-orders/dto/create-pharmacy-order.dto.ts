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
import { CreatePharmacyOrderItemDto } from './create-pharmacy-order-item.dto';

export class CreatePharmacyOrderDto {
  @ApiProperty({
    example: 'cmpajbp0h0001sv3yd0ouloze',
    description: 'ID registrasi pasien',
  })
  @IsString()
  @IsNotEmpty()
  registrationId: string;

  @ApiPropertyOptional({
    example: 'Resep berasal dari pemeriksaan rawat jalan.',
    description: 'Catatan tambahan order farmasi',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;

  @ApiProperty({
    type: [CreatePharmacyOrderItemDto],
    description: 'Daftar item obat dalam order farmasi',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePharmacyOrderItemDto)
  items: CreatePharmacyOrderItemDto[];
}
