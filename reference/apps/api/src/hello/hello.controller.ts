import { Controller, Get, Query } from '@nestjs/common';
import { helloQuerySchema, helloResponseSchema } from '@reference/contract';
import { createZodDto, ZodResponse } from 'nestjs-zod';

class HelloQueryDto extends createZodDto(helloQuerySchema) {}
class HelloResponseDto extends createZodDto(helloResponseSchema) {}

@Controller('hello')
export class HelloController {
  @Get()
  @ZodResponse({ status: 200, type: HelloResponseDto })
  hello(@Query() query: HelloQueryDto) {
    return { message: `Hello, ${query.name}!` };
  }
}
