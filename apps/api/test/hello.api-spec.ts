import { describe, expect, inject, it } from 'vitest';

const apiUrl = inject('apiUrl');

describe('GET /hello', () => {
  it('greets the caller by name', async () => {
    const res = await fetch(`${apiUrl}/hello?name=Ada`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: 'Hello, Ada!' });
  });

  it('greets the world when no name is given', async () => {
    const res = await fetch(`${apiUrl}/hello`);
    expect(await res.json()).toEqual({ message: 'Hello, World!' });
  });

  it('rejects an empty name with 400', async () => {
    const res = await fetch(`${apiUrl}/hello?name=`);
    expect(res.status).toBe(400);
  });

  it('serves an OpenAPI spec describing the endpoint', async () => {
    const res = await fetch(`${apiUrl}/docs-json`);
    expect(res.status).toBe(200);
    const spec = await res.json();
    expect(spec.paths['/hello'].get.parameters[0].name).toBe('name');
  });
});
