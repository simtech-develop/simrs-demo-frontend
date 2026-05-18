import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ClinicsService } from './clinics.service';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';

@ApiTags('Clinics')
@Controller('clinics')
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  @Post()
  create(@Body() createClinicDto: CreateClinicDto) {
    return this.clinicsService.create(createClinicDto);
  }

  @Get()
  findAll() {
    return this.clinicsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clinicsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateClinicDto: UpdateClinicDto,
  ) {
    return this.clinicsService.update(id, updateClinicDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clinicsService.remove(id);
  }
}
