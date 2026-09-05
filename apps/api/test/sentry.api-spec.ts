import { expect, inject, it } from 'vitest';

const apiUrl = inject('apiUrl');

// Sentry's global filter replaces Nest's, so the deliberate error must still come back
// as a plain 500 rather than crash the process.
it('GET /debug/sentry answers 500 with the deliberate test error', async () => {
  const res = await fetch(`${apiUrl}/debug/sentry`);
  expect(res.status).toBe(500);
});
