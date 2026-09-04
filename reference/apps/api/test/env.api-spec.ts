import { spawnSync } from 'node:child_process';
import { expect, it } from 'vitest';

it('refuses to boot when PORT is missing', () => {
  const { status, stderr } = spawnSync('node', ['dist/main.js'], {
    env: { PATH: process.env.PATH },
    encoding: 'utf8',
  });
  expect(status).toBe(1);
  expect(stderr).toContain('PORT');
});
