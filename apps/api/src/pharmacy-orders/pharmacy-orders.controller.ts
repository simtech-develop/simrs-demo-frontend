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
import { PharmacyOrdersService } from './pharmacy-orders.service';
import { CreatePharmacyOrderDto } from './dto/create-pharmacy-order.dto';
import { UpdatePharmacyOrderStatusDto } from './dto/update-pharmacy-order-status.dto';

@ApiTags('Pharmacy Orders')
@Controller('pharmacy-orders')
export class PharmacyOrdersController {
  constructor(
    private readonly pharmacyOrdersService: PharmacyOrdersService,
  ) {}

  @Post()
  create(@Body() createPharmacyOrderDto: CreatePharmacyOrderDto) {
    return this.pharmacyOrdersService.create(createPharmacyOrderDto);
  }

  @Get()
  findAll() {
    return this.pharmacyOrdersService.findAll();
  }

  @Get('registration/:registrationId')
  findByRegistration(
    @Param('registrationId') registrationId: string,
  ) {
    return this.pharmacyOrdersService.findByRegistration(registrationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pharmacyOrdersService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updatePharmacyOrderStatusDto: UpdatePharmacyOrderStatusDto,
  ) {
    return this.pharmacyOrdersService.updateStatus(
      id,
      updatePharmacyOrderStatusDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pharmacyOrdersService.remove(id);
  }
}
