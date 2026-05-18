import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateDoctorDto } from './create-doctor.dto';

export class UpdateDoctorDto extends PartialType(CreateDoctorDto) {
  @ApiPropertyOptional({
    example: true,
    description: 'Status aktif dokter',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
