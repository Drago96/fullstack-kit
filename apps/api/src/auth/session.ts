import type { IncomingHttpHeaders } from 'node:http';
import {
  type CanActivate,
  createParamDecorator,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import { auth, type SessionData } from './auth';

// Only the two members the guards touch, so the guards need no Express types.
type SessionRequest = { headers: IncomingHttpHeaders; session?: SessionData };

const requestOf = (context: ExecutionContext) =>
  context.switchToHttp().getRequest<SessionRequest>();

// Resolves the Better Auth session cookie and refuses the request without one. The
// messages are the stable error codes the web app translates under `errors.<code>`.
@Injectable()
export class SessionGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const request = requestOf(context);
    const session = await auth().api.getSession({ headers: fromNodeHeaders(request.headers) });
    if (!session) throw new UnauthorizedException('auth.required');
    request.session = session;
    return true;
  }
}

// `role` comes from the Better Auth admin plugin, which defaults it to 'user'.
@Injectable()
export class AdminGuard extends SessionGuard {
  override async canActivate(context: ExecutionContext) {
    await super.canActivate(context);
    if (requestOf(context).session?.user.role !== 'admin') {
      throw new ForbiddenException('auth.forbidden');
    }
    return true;
  }
}

// Reads what SessionGuard resolved, so it is only valid on a guarded route.
export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const { session } = requestOf(context);
  if (!session) throw new UnauthorizedException('auth.required');
  return session.user;
});
