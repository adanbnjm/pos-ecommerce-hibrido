import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const configuracionSwagger = new DocumentBuilder()
    .setTitle('POS E-commerce Híbrido API')
    .setDescription('API REST para sistema POS y comercio electrónico híbrido')
    .setVersion('1.0')
    .build();

  const documentoSwagger = SwaggerModule.createDocument(
    app,
    configuracionSwagger,
  );

  SwaggerModule.setup('docs', app, documentoSwagger);

  await app.listen(process.env.PORT ?? 3000);
}

await bootstrap();
