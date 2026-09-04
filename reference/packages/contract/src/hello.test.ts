import { describe, expect, it } from 'vitest';
import { helloQuerySchema } from './hello';

describe('helloQuerySchema', () => {
  it('defaults name to World', () => {
    expect(helloQuerySchema.parse({})).toEqual({ name: 'World' });
  });

  it('rejects an empty name', () => {
    expect(helloQuerySchema.safeParse({ name: '' }).success).toBe(false);
  });
});
