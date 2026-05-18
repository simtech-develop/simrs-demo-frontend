import { Test, TestingModule } from '@nestjs/testing';
import { CashierBillsService } from './cashier-bills.service';

describe('CashierBillsService', () => {
  let service: CashierBillsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CashierBillsService],
    }).compile();

    service = module.get<CashierBillsService>(CashierBillsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
