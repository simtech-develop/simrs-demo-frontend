import { Test, TestingModule } from '@nestjs/testing';
import { EmergencyAssessmentsController } from './emergency-assessments.controller';

describe('EmergencyAssessmentsController', () => {
  let controller: EmergencyAssessmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmergencyAssessmentsController],
    }).compile();

    controller = module.get<EmergencyAssessmentsController>(EmergencyAssessmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
