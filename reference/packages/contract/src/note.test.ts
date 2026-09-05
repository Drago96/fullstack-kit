import { describe, expect, it } from 'vitest';
import { createNoteSchema } from './note';

const firstIssue = (note: unknown) => createNoteSchema.safeParse(note).error?.issues[0]?.message;

describe('createNoteSchema', () => {
  it('rejects an empty title with a translatable code', () => {
    expect(firstIssue({ title: '', body: 'x' })).toBe('note.title.required');
  });

  it('rejects a title over 200 characters with a translatable code', () => {
    expect(firstIssue({ title: 'a'.repeat(201), body: '' })).toBe('note.title.tooLong');
  });

  it('accepts an empty body', () => {
    expect(createNoteSchema.parse({ title: 'Note', body: '' })).toEqual({
      title: 'Note',
      body: '',
    });
  });
});
