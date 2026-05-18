import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  EmergencyAssessmentStatus,
  EmergencyTriageLevel,
} from '../../generated/prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateEmergencyAssessmentDto {
  @ApiPropertyOptional({
    enum: EmergencyTriageLevel,
    example: EmergencyTriageLevel.YELLOW,
    description: 'Klasifikasi triage IGD',
  })
  @IsOptional()
  @IsEnum(EmergencyTriageLevel)
  triageLevel?: EmergencyTriageLevel;

  @ApiPropertyOptional({
    example: 'Nyeri dada dan sesak napas',
    description: 'Keluhan utama',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  chiefComplaint?: string;

  @ApiPropertyOptional({
    example: 'Compos mentis',
    description: 'Status kesadaran pasien',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  consciousness?: string;

  @ApiPropertyOptional({
    example: '130/85 mmHg',
    description: 'Tekanan darah',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bloodPressure?: string;

  @ApiPropertyOptional({
    example: '96 x/menit',
    description: 'Nadi',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  pulse?: string;

  @ApiPropertyOptional({
    example: '22 x/menit',
    description: 'Respiratory rate',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  respiratoryRate?: string;

  @ApiPropertyOptional({
    example: '97%',
    description: 'Saturasi oksigen',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  oxygenSaturation?: string;

  @ApiPropertyOptional({
    example: 'Pasien memerlukan observasi lanjutan.',
    description: 'Catatan petugas IGD',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  emergencyNote?: string;

  @ApiPropertyOptional({
    enum: EmergencyAssessmentStatus,
    example: EmergencyAssessmentStatus.TRIAGE_COMPLETED,
    description: 'Status asesmen IGD',
  })
  @IsOptional()
  @IsEnum(EmergencyAssessmentStatus)
  status?: EmergencyAssessmentStatus;
}
