import { Test, TestingModule } from '@nestjs/testing';
import { PharmacyOrdersController } from './pharmacy-orders.controller';

describe('PharmacyOrdersController', () => {
  let controller: PharmacyOrdersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PharmacyOrdersController],
    }).compile();

    controller = module.get<PharmacyOrdersController>(PharmacyOrdersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
