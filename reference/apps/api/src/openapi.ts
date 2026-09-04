import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

export function buildOpenApiDoc(app: INestApplication) {
  const config = new DocumentBuilder().setTitle('api').setVersion('0.0.0').build();
  return cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));
}
