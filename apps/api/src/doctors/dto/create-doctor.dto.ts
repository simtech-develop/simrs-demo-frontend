import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateDoctorDto {
  @ApiProperty({
    example: 'DR-001',
    description: 'Kode unik dokter',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  doctorCode: string;

  @ApiProperty({
    example: 'dr. Andi Pratama',
    description: 'Nama lengkap dokter',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  fullName: string;

  @ApiPropertyOptional({
    example: 'Dokter Umum',
    description: 'Spesialisasi dokter',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  specialization?: string;

  @ApiPropertyOptional({
    example: 'SIP-2026-001',
    description: 'Nomor SIP dokter',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sipNumber?: string;

  @ApiPropertyOptional({
    example: 'cmpaexw7x0000qb3yzz3ujjuq',
    description: 'ID poli tempat dokter bertugas',
  })
  @IsOptional()
  @IsString()
  clinicId?: string;
}
