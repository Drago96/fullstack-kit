import { describe, expect, it } from 'vitest';
import { createNoteSchema } from './note';

describe('createNoteSchema', () => {
  it('rejects an empty title', () => {
    expect(createNoteSchema.safeParse({ title: '', body: 'x' }).success).toBe(false);
  });

  it('rejects a title over 200 characters', () => {
    expect(createNoteSchema.safeParse({ title: 'a'.repeat(201), body: '' }).success).toBe(false);
  });

  it('accepts an empty body', () => {
    expect(createNoteSchema.parse({ title: 'Note', body: '' })).toEqual({
      title: 'Note',
      body: '',
    });
  });
});
