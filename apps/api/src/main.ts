import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('SIMRS Demo API')
    .setDescription('Dokumentasi REST API untuk SIMRS Demo Tipe D/C')
    .setVersion('1.0.0')
    .addTag('System')
    .addTag('Clinics')
    .addTag('Doctors')
    .addTag('Patients')
    .addTag('Registrations')
    .addTag('Medical Records')
    .addTag('Pharmacy Orders')
    .addTag('Cashier Bills')
    .addTag('Emergency Assessments')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
