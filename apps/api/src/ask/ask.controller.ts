import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { Body, Controller, Post } from '@nestjs/common';
import { answerSchema, askSchema } from '@reference/contract';
import { generateText } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import { createZodDto, ZodResponse } from 'nestjs-zod';
import { env } from '../env';

class AskDto extends createZodDto(askSchema) {}
class AnswerDto extends createZodDto(answerSchema) {}

// Keeps CI and local runs free of an API key and a network call, and deterministic.
const mockModel = new MockLanguageModelV4({
  doGenerate: async ({ prompt }) => {
    const asked = prompt
      .flatMap((message) => (message.role === 'user' ? message.content : []))
      .flatMap((part) => (part.type === 'text' ? part.text : []))
      .join(' ');
    return {
      content: [{ type: 'text' as const, text: `mock answer to: ${asked}` }],
      finishReason: { unified: 'stop' as const, raw: undefined },
      usage: {
        inputTokens: { total: 0, noCache: 0, cacheRead: 0, cacheWrite: 0 },
        outputTokens: { total: 0, text: 0, reasoning: 0 },
      },
      warnings: [],
    };
  },
});

function askModel() {
  const { LLM_PROVIDER: provider, GOOGLE_GENERATIVE_AI_API_KEY: apiKey } = env();
  if (provider === 'mock') return mockModel;
  // env.ts refuses to boot without it, so this only guards the type.
  if (!apiKey) throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is missing');
  return createGoogleGenerativeAI({ apiKey })('gemini-3.6-flash');
}

@Controller('ask')
export class AskController {
  @Post()
  @ZodResponse({ status: 200, type: AnswerDto })
  async ask(@Body() { prompt }: AskDto) {
    const { text } = await generateText({ model: askModel(), prompt });
    return { answer: text };
  }
}
