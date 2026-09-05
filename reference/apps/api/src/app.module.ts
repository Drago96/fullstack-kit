import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { LoggerModule } from 'nestjs-pino';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { AskController } from './ask/ask.controller';
import { HelloController } from './hello/hello.controller';
import { NotesController } from './notes/notes.controller';
import { SentryController } from './sentry/sentry.controller';

@Module({
  imports: [
    // Without it Nest swallows exceptions before Sentry sees them. A no-op until
    // src/instrument.ts initialises the SDK, which needs SENTRY_DSN.
    SentryModule.forRoot(),
    LoggerModule.forRoot({
      // Validated by src/env.ts before main.ts boots. Read raw here so write-openapi.ts
      // can load this module without a PORT.
      pinoHttp: { level: process.env.LOG_LEVEL ?? 'info' },
    }),
  ],
  controllers: [AskController, HelloController, NotesController, SentryController],
  providers: [
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
  ],
})
export class AppModule {}
