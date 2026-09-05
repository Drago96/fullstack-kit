// Must stay first: Sentry has to initialise before the libraries it instruments load.
import './instrument';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import { toNodeHandler } from 'better-auth/node';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { auth } from './auth/auth';
import { applyMigrations, connect } from './db/db';
import { env } from './env';
import { buildOpenApiDoc } from './openapi';

async function bootstrap() {
  connect(env().DATABASE_URL);
  await applyMigrations();
  // Better Auth reads the raw request body itself, so it is mounted before the JSON
  // parser rather than after; every Nest route still gets a parsed body.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    bodyParser: false,
  });
  app.use('/auth', toNodeHandler(auth()));
  app.useBodyParser('json');
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
  SwaggerModule.setup('docs', app, buildOpenApiDoc(app));
  await app.listen(env().PORT);
}

bootstrap();
