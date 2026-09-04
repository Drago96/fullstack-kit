import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { HelloController } from './hello/hello.controller';
import { NotesController } from './notes/notes.controller';

@Module({
  imports: [
    LoggerModule.forRoot({
      // Validated by src/env.ts before main.ts boots. Read raw here so write-openapi.ts
      // can load this module without a PORT.
      pinoHttp: { level: process.env.LOG_LEVEL ?? 'info' },
    }),
  ],
  controllers: [HelloController, NotesController],
  providers: [
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
  ],
})
export class AppModule {}
