import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MedicalRecordsService } from './medical-records.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';

@ApiTags('Medical Records')
@Controller('medical-records')
export class MedicalRecordsController {
  constructor(
    private readonly medicalRecordsService: MedicalRecordsService,
  ) {}

  @Post()
  create(@Body() createMedicalRecordDto: CreateMedicalRecordDto) {
    return this.medicalRecordsService.create(createMedicalRecordDto);
  }

  @Get()
  findAll() {
    return this.medicalRecordsService.findAll();
  }

  @Get('registration/:registrationId')
  findByRegistration(
    @Param('registrationId') registrationId: string,
  ) {
    return this.medicalRecordsService.findByRegistration(registrationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.medicalRecordsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMedicalRecordDto: UpdateMedicalRecordDto,
  ) {
    return this.medicalRecordsService.update(
      id,
      updateMedicalRecordDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.medicalRecordsService.remove(id);
  }
}
