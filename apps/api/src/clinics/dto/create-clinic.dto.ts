import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateClinicDto {
  @ApiProperty({
    example: 'UMUM',
    description: 'Kode unik poli',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  code: string;

  @ApiProperty({
    example: 'Poli Umum',
    description: 'Nama poli',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({
    example: 'Layanan pemeriksaan umum',
    description: 'Deskripsi singkat poli',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
