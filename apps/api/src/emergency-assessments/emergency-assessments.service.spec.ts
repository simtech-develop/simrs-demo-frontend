import { Test, TestingModule } from '@nestjs/testing';
import { EmergencyAssessmentsService } from './emergency-assessments.service';

describe('EmergencyAssessmentsService', () => {
  let service: EmergencyAssessmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmergencyAssessmentsService],
    }).compile();

    service = module.get<EmergencyAssessmentsService>(EmergencyAssessmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
