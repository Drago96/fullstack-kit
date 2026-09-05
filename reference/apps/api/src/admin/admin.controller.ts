import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { adminUserListSchema, authFailureSchema } from '@reference/contract';
import { asc } from 'drizzle-orm';
import { createZodDto, ZodResponse } from 'nestjs-zod';
import { AdminGuard } from '../auth/session';
import { db } from '../db/db';
import { user } from '../db/schema';

class AdminUserListDto extends createZodDto(adminUserListSchema) {}
class AuthFailureDto extends createZodDto(authFailureSchema) {}

@Controller('admin')
@UseGuards(AdminGuard)
@ApiResponse({ status: 401, type: AuthFailureDto })
@ApiResponse({ status: 403, type: AuthFailureDto })
export class AdminController {
  @Get('users')
  @ZodResponse({ status: 200, type: AdminUserListDto })
  async users() {
    const rows = await db()
      .select({ id: user.id, email: user.email, role: user.role })
      .from(user)
      .orderBy(asc(user.email));
    // The admin plugin leaves `role` unset until it is assigned; everyone else is a user.
    return rows.map((row) => ({ ...row, role: row.role ?? 'user' }));
  }
}
