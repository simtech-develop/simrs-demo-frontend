import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Gender } from '../../generated/prisma/client';

export class CreatePatientDto {
  @ApiProperty({
    example: 'RM-000001',
    description: 'Nomor rekam medis pasien',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  medicalRecordNo: string;

  @ApiPropertyOptional({
    example: '3201010101010001',
    description: 'Nomor identitas/NIK pasien',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  nationalId?: string;

  @ApiProperty({
    example: 'Budi Santoso',
    description: 'Nama lengkap pasien',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  fullName: string;

  @ApiProperty({
    enum: Gender,
    example: Gender.MALE,
    description: 'Jenis kelamin pasien',
  })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({
    example: '1990-01-15',
    description: 'Tanggal lahir pasien',
  })
  @IsDateString()
  birthDate: string;

  @ApiPropertyOptional({
    example: '081234567890',
    description: 'Nomor telepon pasien',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({
    example: 'Jl. Merdeka No. 1',
    description: 'Alamat pasien',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;
}
