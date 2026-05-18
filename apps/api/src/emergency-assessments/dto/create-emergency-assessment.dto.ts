import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateEmergencyAssessmentDto {
  @ApiProperty({
    example: 'cmpabc123registration',
    description: 'ID registrasi pasien IGD',
  })
  @IsString()
  @IsNotEmpty()
  registrationId: string;

  @ApiPropertyOptional({
    example: 'Pasien datang dengan sesak napas',
    description: 'Keluhan utama pasien IGD',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  chiefComplaint?: string;
}
