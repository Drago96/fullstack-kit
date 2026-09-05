import { describe, expect, it } from 'vitest';
import { credentialsSchema, signUpSchema } from './auth';

describe('credentialsSchema', () => {
  it('rejects a malformed email with a translatable code', () => {
    const result = credentialsSchema.safeParse({ email: 'nope', password: 'longenough' });
    expect(result.error?.issues[0]?.message).toBe('auth.email.invalid');
  });

  it('rejects a password under eight characters with a translatable code', () => {
    const result = credentialsSchema.safeParse({ email: 'ada@example.com', password: 'short' });
    expect(result.error?.issues[0]?.message).toBe('auth.password.tooShort');
  });
});

describe('signUpSchema', () => {
  it('rejects an empty name with a translatable code', () => {
    const result = signUpSchema.safeParse({
      email: 'ada@example.com',
      password: 'longenough',
      name: '',
    });
    expect(result.error?.issues[0]?.message).toBe('auth.name.required');
  });

  it('accepts a full sign-up', () => {
    const signUp = { email: 'ada@example.com', password: 'longenough', name: 'Ada' };
    expect(signUpSchema.parse(signUp)).toEqual(signUp);
  });
});
