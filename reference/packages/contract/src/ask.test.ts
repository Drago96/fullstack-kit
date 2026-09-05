import { describe, expect, it } from 'vitest';
import { askSchema } from './ask';

describe('askSchema', () => {
  it('rejects an empty prompt', () => {
    expect(askSchema.safeParse({ prompt: '' }).success).toBe(false);
  });

  it('rejects a prompt over 2000 characters', () => {
    expect(askSchema.safeParse({ prompt: 'a'.repeat(2001) }).success).toBe(false);
  });

  it('accepts a prompt at the limit', () => {
    expect(askSchema.safeParse({ prompt: 'a'.repeat(2000) }).success).toBe(true);
  });
});
