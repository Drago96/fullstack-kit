import postgres from 'postgres';
import { afterAll, beforeEach, describe, expect, inject, it } from 'vitest';
import { signedInUser } from './sign-in';

const apiUrl = inject('apiUrl');
const sql = postgres(inject('databaseUrl'), { max: 1 });

let cookie = '';

beforeEach(async () => {
  await sql`truncate table notes, "user", session, account, verification cascade`;
  cookie = await signedInUser('owner@example.com');
});

afterAll(async () => {
  await sql.end();
});

const postNote = (note: unknown, as = cookie) =>
  fetch(`${apiUrl}/notes`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(as ? { cookie: as } : {}) },
    body: JSON.stringify(note),
  });

const listNotes = (as = cookie) => fetch(`${apiUrl}/notes`, { headers: as ? { cookie: as } : {} });

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
    const res = await listNotes();
    expect(res.status).toBe(200);
    const notes: { title: string }[] = await res.json();
    expect(notes.map((note) => note.title)).toEqual(['Newer', 'Older']);
  });

  it('rejects an empty title with 400 and the error code the web app translates', async () => {
    const res = await postNote({ title: '', body: 'Hello' });
    expect(res.status).toBe(400);
    const failure: { errors: { message: string }[] } = await res.json();
    expect(failure.errors.map((issue) => issue.message)).toEqual(['note.title.required']);
    expect(await countRows()).toBe(0);
  });

  it('refuses to create or list without a session', async () => {
    expect((await postNote({ title: 'Anonymous', body: '' }, '')).status).toBe(401);
    const res = await listNotes('');
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ statusCode: 401, message: 'auth.required' });
    expect(await countRows()).toBe(0);
  });

  it('never shows one user the notes of another', async () => {
    await postNote({ title: "Owner's note", body: 'private' });
    const other = await signedInUser('other@example.com');

    const theirs: { title: string }[] = await (await listNotes(other)).json();
    expect(theirs).toEqual([]);

    await postNote({ title: 'Their note', body: '' }, other);
    const mine: { title: string }[] = await (await listNotes()).json();
    expect(mine.map((note) => note.title)).toEqual(["Owner's note"]);
  });
});
