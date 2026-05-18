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
import { EmergencyAssessmentsService } from './emergency-assessments.service';
import { CreateEmergencyAssessmentDto } from './dto/create-emergency-assessment.dto';
import { UpdateEmergencyAssessmentDto } from './dto/update-emergency-assessment.dto';

@ApiTags('Emergency Assessments')
@Controller('emergency-assessments')
export class EmergencyAssessmentsController {
  constructor(
    private readonly emergencyAssessmentsService: EmergencyAssessmentsService,
  ) {}

  @Post()
  create(
    @Body() createEmergencyAssessmentDto: CreateEmergencyAssessmentDto,
  ) {
    return this.emergencyAssessmentsService.create(
      createEmergencyAssessmentDto,
    );
  }

  @Get()
  findAll() {
    return this.emergencyAssessmentsService.findAll();
  }

  @Get('registration/:registrationId')
  findByRegistration(
    @Param('registrationId') registrationId: string,
  ) {
    return this.emergencyAssessmentsService.findByRegistration(registrationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.emergencyAssessmentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEmergencyAssessmentDto: UpdateEmergencyAssessmentDto,
  ) {
    return this.emergencyAssessmentsService.update(
      id,
      updateEmergencyAssessmentDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.emergencyAssessmentsService.remove(id);
  }
}
