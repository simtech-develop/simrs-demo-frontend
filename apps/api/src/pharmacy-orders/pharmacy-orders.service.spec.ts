import { Test, TestingModule } from '@nestjs/testing';
import { PharmacyOrdersService } from './pharmacy-orders.service';

describe('PharmacyOrdersService', () => {
  let service: PharmacyOrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PharmacyOrdersService],
    }).compile();

    service = module.get<PharmacyOrdersService>(PharmacyOrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
