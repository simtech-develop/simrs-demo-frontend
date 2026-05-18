import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateClinicDto } from './create-clinic.dto';

export class UpdateClinicDto extends PartialType(CreateClinicDto) {
  @ApiPropertyOptional({
    example: true,
    description: 'Status aktif poli',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
