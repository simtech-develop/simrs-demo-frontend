import { Module } from '@nestjs/common';
import { CashierBillsController } from './cashier-bills.controller';
import { CashierBillsService } from './cashier-bills.service';

@Module({
  controllers: [CashierBillsController],
  providers: [CashierBillsService],
})
export class CashierBillsModule {}
