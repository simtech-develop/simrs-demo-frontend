import { Test, TestingModule } from '@nestjs/testing';
import { CashierBillsController } from './cashier-bills.controller';

describe('CashierBillsController', () => {
  let controller: CashierBillsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CashierBillsController],
    }).compile();

    controller = module.get<CashierBillsController>(CashierBillsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
