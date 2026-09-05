import { spawnSync } from 'node:child_process';
import { expect, inject, it } from 'vitest';

const boot = (env: NodeJS.ProcessEnv = {}) =>
  spawnSync('node', ['dist/main.js'], {
    env: { PATH: process.env.PATH, ...env },
    encoding: 'utf8',
  });

it('refuses to boot when PORT is missing', () => {
  const { status, stderr } = boot();
  expect(status).toBe(1);
  expect(stderr).toContain('PORT');
});

it('refuses to boot when DATABASE_URL is missing', () => {
  const { status, stderr } = boot();
  expect(status).toBe(1);
  expect(stderr).toContain('DATABASE_URL');
});

it('refuses to boot when a real LLM provider has no API key', () => {
  const { status, stderr } = boot({
    PORT: '3199',
    DATABASE_URL: inject('databaseUrl'),
    LLM_PROVIDER: 'google',
  });
  expect(status).toBe(1);
  expect(stderr).toContain('GOOGLE_GENERATIVE_AI_API_KEY');
});
