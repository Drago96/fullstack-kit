import { z } from 'zod';

// The body Nest's UnauthorizedException and ForbiddenException return from the auth
// guards. `message` is a stable error code the web app translates under `errors.<code>`.
export const authFailureSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
});

// Credentials go to Better Auth rather than to a Nest endpoint, but they live here with
// every other request shape so the sign-up and log-in forms validate against the same
// rules the API enforces. Better Auth's own minimum password length is 8.
export const credentialsSchema = z.object({
  email: z.email('auth.email.invalid'),
  password: z.string().min(8, 'auth.password.tooShort'),
});

export type Credentials = z.infer<typeof credentialsSchema>;

export const signUpSchema = credentialsSchema.extend({
  name: z.string().min(1, 'auth.name.required'),
});

export type SignUp = z.infer<typeof signUpSchema>;

export const resetRequestSchema = credentialsSchema.pick({ email: true });

export type ResetRequest = z.infer<typeof resetRequestSchema>;

export const newPasswordSchema = credentialsSchema.pick({ password: true });

export type NewPassword = z.infer<typeof newPasswordSchema>;

export const adminUserListSchema = z.array(
  z.object({
    id: z.string(),
    email: z.email(),
    role: z.string(),
  }),
);
