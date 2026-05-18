import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreatePharmacyOrderItemDto {
  @ApiProperty({
    example: 'Paracetamol 500 mg',
    description: 'Nama obat',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  medicineName: string;

  @ApiProperty({
    example: '1 tablet',
    description: 'Dosis obat',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  dosage: string;

  @ApiProperty({
    example: '3x sehari',
    description: 'Frekuensi penggunaan obat',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  frequency: string;

  @ApiProperty({
    example: '10 tablet',
    description: 'Jumlah obat',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  quantity: string;

  @ApiPropertyOptional({
    example: 'Diminum sesudah makan',
    description: 'Aturan atau instruksi pemakaian obat',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  instruction?: string;
}
