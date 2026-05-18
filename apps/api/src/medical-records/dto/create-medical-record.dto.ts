import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateMedicalRecordDto {
  @ApiProperty({
    example: 'cmpag7vkl0000q53yr8q8zgr1',
    description: 'ID registrasi kunjungan pasien',
  })
  @IsString()
  @IsNotEmpty()
  registrationId: string;

  @ApiPropertyOptional({
    example: 'Pasien mengeluh demam dan batuk sejak dua hari.',
    description: 'Anamnesis pasien',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  anamnesis?: string;

  @ApiPropertyOptional({
    example: 'Keadaan umum baik, suhu 38°C, tekanan darah stabil.',
    description: 'Hasil pemeriksaan fisik',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  physicalExamination?: string;

  @ApiPropertyOptional({
    example: 'Infeksi saluran pernapasan atas',
    description: 'Diagnosis klinis',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  diagnosis?: string;

  @ApiPropertyOptional({
    example: 'Istirahat cukup, observasi suhu, kontrol bila keluhan memburuk.',
    description: 'Rencana terapi atau tindak lanjut',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  treatmentPlan?: string;

  @ApiPropertyOptional({
    example: 'Parasetamol 500 mg, 3x1 bila demam.',
    description: 'Catatan resep sederhana',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  prescriptionNote?: string;
}
