import { writeFileSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { buildOpenApiDoc } from './openapi';

async function main() {
  const out = process.argv[2];
  if (!out) throw new Error('usage: write-openapi <output.json>');
  const app = await NestFactory.create(AppModule, { logger: false });
  writeFileSync(out, `${JSON.stringify(buildOpenApiDoc(app), null, 2)}\n`);
  await app.close();
}

main();
