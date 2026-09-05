import { spawnSync } from 'node:child_process';
import { expect, inject, it } from 'vitest';
import { testEnv } from './start-api';

const boot = (env: NodeJS.ProcessEnv = {}) =>
  spawnSync('node', ['dist/main.js'], {
    env: { PATH: process.env.PATH, ...env },
    encoding: 'utf8',
  });

// A complete environment except for whatever the test leaves out, on a port nothing else
// uses because every one of these boots is expected to fail before it listens.
const validEnv = { ...testEnv, PORT: '3199', DATABASE_URL: inject('databaseUrl') };

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

it('refuses to boot without an auth secret', () => {
  const { AUTH_SECRET: _omitted, ...withoutSecret } = validEnv;
  const { status, stderr } = boot(withoutSecret);
  expect(status).toBe(1);
  expect(stderr).toContain('AUTH_SECRET');
});

it('refuses to boot when a real LLM provider has no API key', () => {
  const { status, stderr } = boot({ ...validEnv, LLM_PROVIDER: 'google' });
  expect(status).toBe(1);
  expect(stderr).toContain('GOOGLE_GENERATIVE_AI_API_KEY');
});

it('refuses to boot when the real email transport has no API key', () => {
  const { status, stderr } = boot({ ...validEnv, EMAIL_TRANSPORT: 'resend' });
  expect(status).toBe(1);
  expect(stderr).toContain('RESEND_API_KEY');
});
