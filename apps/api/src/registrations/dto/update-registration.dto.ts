import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { RegistrationStatus } from '../../generated/prisma/client';

export class UpdateRegistrationDto {
  @ApiPropertyOptional({
    example: 'Keluhan diperbarui setelah verifikasi petugas',
    description: 'Keluhan utama pasien',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  chiefComplaint?: string;

  @ApiPropertyOptional({
    example: 'cmpafw7u80000bg3ynfvklze7',
    description: 'ID dokter yang melayani',
  })
  @IsOptional()
  @IsString()
  doctorId?: string;

  @ApiPropertyOptional({
    enum: RegistrationStatus,
    example: RegistrationStatus.IN_SERVICE,
    description: 'Status proses kunjungan pasien',
  })
  @IsOptional()
  @IsEnum(RegistrationStatus)
  status?: RegistrationStatus;
}
