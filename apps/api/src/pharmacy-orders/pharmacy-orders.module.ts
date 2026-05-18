import { Module } from '@nestjs/common';
import { PharmacyOrdersController } from './pharmacy-orders.controller';
import { PharmacyOrdersService } from './pharmacy-orders.service';

@Module({
  controllers: [PharmacyOrdersController],
  providers: [PharmacyOrdersService],
})
export class PharmacyOrdersModule {}
