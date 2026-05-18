import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('System')
@Controller()
export class AppController {
  @Get()
  getApiInfo() {
    return {
      app: 'SIMRS Demo API',
      version: '1.0.0',
      status: 'running',
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'simrs-demo-api',
      timestamp: new Date().toISOString(),
    };
  }
}
