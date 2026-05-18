import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateRegistrationDto {
  @ApiProperty({
    example: '2026-05-18',
    description: 'Tanggal kunjungan pasien',
  })
  @IsDateString()
  visitDate: string;

  @ApiPropertyOptional({
    example: 'Demam dan batuk sejak dua hari',
    description: 'Keluhan utama saat pendaftaran',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  chiefComplaint?: string;

  @ApiProperty({
    example: 'cmpag157z0000in3ykodml0c1',
    description: 'ID pasien',
  })
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({
    example: 'cmpaexw7x0000qb3yzz3ujjuq',
    description: 'ID poli tujuan',
  })
  @IsString()
  @IsNotEmpty()
  clinicId: string;

  @ApiPropertyOptional({
    example: 'cmpafw7u80000bg3ynfvklze7',
    description: 'ID dokter yang melayani',
  })
  @IsOptional()
  @IsString()
  doctorId?: string;
}
