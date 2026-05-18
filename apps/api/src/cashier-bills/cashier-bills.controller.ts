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
import { CashierBillsService } from './cashier-bills.service';
import { CreateCashierBillDto } from './dto/create-cashier-bill.dto';
import { UpdateCashierBillStatusDto } from './dto/update-cashier-bill-status.dto';

@ApiTags('Cashier Bills')
@Controller('cashier-bills')
export class CashierBillsController {
  constructor(
    private readonly cashierBillsService: CashierBillsService,
  ) {}

  @Post()
  create(@Body() createCashierBillDto: CreateCashierBillDto) {
    return this.cashierBillsService.create(createCashierBillDto);
  }

  @Get()
  findAll() {
    return this.cashierBillsService.findAll();
  }

  @Get('registration/:registrationId')
  findByRegistration(
    @Param('registrationId') registrationId: string,
  ) {
    return this.cashierBillsService.findByRegistration(registrationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cashierBillsService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateCashierBillStatusDto: UpdateCashierBillStatusDto,
  ) {
    return this.cashierBillsService.updateStatus(
      id,
      updateCashierBillStatusDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cashierBillsService.remove(id);
  }
}
