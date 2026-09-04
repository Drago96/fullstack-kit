import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { applyMigrations, connect } from './db/db';
import { env } from './env';
import { buildOpenApiDoc } from './openapi';

async function bootstrap() {
  connect(env.DATABASE_URL);
  await applyMigrations();
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
  SwaggerModule.setup('docs', app, buildOpenApiDoc(app));
  await app.listen(env.PORT);
}

bootstrap();
