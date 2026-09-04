import { spawnSync } from 'node:child_process';
import { expect, it } from 'vitest';

const boot = () =>
  spawnSync('node', ['dist/main.js'], {
    env: { PATH: process.env.PATH },
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
