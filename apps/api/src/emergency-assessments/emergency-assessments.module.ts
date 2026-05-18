import { Module } from '@nestjs/common';
import { EmergencyAssessmentsController } from './emergency-assessments.controller';
import { EmergencyAssessmentsService } from './emergency-assessments.service';

@Module({
  controllers: [EmergencyAssessmentsController],
  providers: [EmergencyAssessmentsService],
})
export class EmergencyAssessmentsModule {}
