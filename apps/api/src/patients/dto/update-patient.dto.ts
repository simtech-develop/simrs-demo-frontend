import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreatePatientDto } from './create-patient.dto';

export class UpdatePatientDto extends PartialType(CreatePatientDto) {
  @ApiPropertyOptional({
    example: true,
    description: 'Status aktif pasien',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
