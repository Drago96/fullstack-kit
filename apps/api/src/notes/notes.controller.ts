import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import {
  authFailureSchema,
  createNoteSchema,
  noteListSchema,
  noteSchema,
  validationFailureSchema,
} from '@reference/contract';
import { desc, eq } from 'drizzle-orm';
import { createZodDto, ZodResponse } from 'nestjs-zod';
import type { SessionUser } from '../auth/auth';
import { CurrentUser, SessionGuard } from '../auth/session';
import { db } from '../db/db';
import { notes } from '../db/schema';

class CreateNoteDto extends createZodDto(createNoteSchema) {}
class NoteDto extends createZodDto(noteSchema) {}
class NoteListDto extends createZodDto(noteListSchema) {}
class ValidationFailureDto extends createZodDto(validationFailureSchema) {}
class AuthFailureDto extends createZodDto(authFailureSchema) {}

// Postgres hands back a Date; the Contract says ISO 8601. `ownerId` is not in the
// Contract, so the response schema drops it on the way out.
const toNote = (row: typeof notes.$inferSelect) => ({
  ...row,
  createdAt: row.createdAt.toISOString(),
});

// A note belongs to whoever created it: both routes work off the session's user, so
// there is no way to ask for someone else's.
@Controller('notes')
@UseGuards(SessionGuard)
@ApiResponse({ status: 401, type: AuthFailureDto })
export class NotesController {
  @Post()
  @ZodResponse({ status: 201, type: NoteDto })
  // Documented so the generated client types the error codes the web app translates.
  @ApiResponse({ status: 400, type: ValidationFailureDto })
  async create(@Body() note: CreateNoteDto, @CurrentUser() user: SessionUser) {
    const [created] = await db()
      .insert(notes)
      .values({ ...note, ownerId: user.id })
      .returning();
    if (!created) throw new Error('Inserting a note returned no row');
    return toNote(created);
  }

  @Get()
  @ZodResponse({ status: 200, type: NoteListDto })
  async list(@CurrentUser() user: SessionUser) {
    const rows = await db()
      .select()
      .from(notes)
      .where(eq(notes.ownerId, user.id))
      .orderBy(desc(notes.createdAt));
    return rows.map(toNote);
  }
}
