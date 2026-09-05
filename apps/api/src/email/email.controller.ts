import { Controller, Get, NotFoundException } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { env } from '../env';
import { capturedEmails } from './email';

@Controller('debug')
export class EmailController {
  // What the capture transport recorded, so the API and E2E tests can follow the
  // verification and password-reset links. Under any other transport it answers 404, so
  // a deployed API never exposes it. Kept out of the OpenAPI document and the generated
  // client for the same reason GET /debug/sentry is.
  @Get('emails')
  @ApiExcludeEndpoint()
  list() {
    if (env().EMAIL_TRANSPORT !== 'capture') throw new NotFoundException();
    return capturedEmails();
  }
}
