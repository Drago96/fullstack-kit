import { Controller, Get } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

@Controller('debug')
export class SentryController {
  // The deliberate test error: hit GET /debug/sentry with SENTRY_DSN set and the
  // exception shows up in Sentry. It has no success path, so it is not in the Contract
  // and is kept out of the OpenAPI document and the generated client.
  @Get('sentry')
  @ApiExcludeEndpoint()
  throwOnPurpose(): never {
    throw new Error('Deliberate test error from GET /debug/sentry');
  }
}
