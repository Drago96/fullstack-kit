import { Body, Controller, Get, Post } from '@nestjs/common';
import { createNoteSchema, noteListSchema, noteSchema } from '@reference/contract';
import { desc } from 'drizzle-orm';
import { createZodDto, ZodResponse } from 'nestjs-zod';
import { db } from '../db/db';
import { notes } from '../db/schema';

class CreateNoteDto extends createZodDto(createNoteSchema) {}
class NoteDto extends createZodDto(noteSchema) {}
class NoteListDto extends createZodDto(noteListSchema) {}

// Postgres hands back a Date; the Contract says ISO 8601.
const toNote = (row: typeof notes.$inferSelect) => ({
  ...row,
  createdAt: row.createdAt.toISOString(),
});

@Controller('notes')
export class NotesController {
  @Post()
  @ZodResponse({ status: 201, type: NoteDto })
  async create(@Body() note: CreateNoteDto) {
    const [created] = await db().insert(notes).values(note).returning();
    if (!created) throw new Error('Inserting a note returned no row');
    return toNote(created);
  }

  @Get()
  @ZodResponse({ status: 200, type: NoteListDto })
  async list() {
    const rows = await db().select().from(notes).orderBy(desc(notes.createdAt));
    return rows.map(toNote);
  }
}
