import { describe, expect, inject, it } from 'vitest';

const apiUrl = inject('apiUrl');

const postAsk = (body: unknown) =>
  fetch(`${apiUrl}/ask`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

// The API under test runs with LLM_PROVIDER=mock, so no key and no network call.
describe('POST /ask', () => {
  it('answers a prompt with 200', async () => {
    const res = await postAsk({ prompt: 'What is the Kit?' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ answer: 'mock answer to: What is the Kit?' });
  });

  it('rejects an empty prompt with 400', async () => {
    const res = await postAsk({ prompt: '' });
    expect(res.status).toBe(400);
  });
});
