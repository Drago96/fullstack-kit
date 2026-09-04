import postgres from 'postgres';
import { afterAll, beforeEach, describe, expect, inject, it } from 'vitest';

const apiUrl = inject('apiUrl');
const sql = postgres(inject('databaseUrl'), { max: 1 });

beforeEach(async () => {
  await sql`truncate table notes`;
});

afterAll(async () => {
  await sql.end();
});

const postNote = (note: unknown) =>
  fetch(`${apiUrl}/notes`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(note),
  });

const countRows = async () => {
  const [row] = await sql<{ count: number }[]>`select count(*)::int as count from notes`;
  return row?.count;
};

describe('/notes', () => {
  it('creates a note and returns 201 with the stored row', async () => {
    const res = await postNote({ title: 'First', body: 'Hello' });
    expect(res.status).toBe(201);
    const note: { id: string; title: string; body: string; createdAt: string } = await res.json();
    expect(note).toMatchObject({ title: 'First', body: 'Hello' });
    expect(Number.isNaN(new Date(note.createdAt).getTime())).toBe(false);
    expect(await countRows()).toBe(1);
  });

  it('lists notes newest first', async () => {
    await postNote({ title: 'Older', body: '' });
    await postNote({ title: 'Newer', body: '' });
    const res = await fetch(`${apiUrl}/notes`);
    expect(res.status).toBe(200);
    const notes: { title: string }[] = await res.json();
    expect(notes.map((note) => note.title)).toEqual(['Newer', 'Older']);
  });

  it('rejects an empty title with 400', async () => {
    const res = await postNote({ title: '', body: 'Hello' });
    expect(res.status).toBe(400);
    expect(await countRows()).toBe(0);
  });
});
