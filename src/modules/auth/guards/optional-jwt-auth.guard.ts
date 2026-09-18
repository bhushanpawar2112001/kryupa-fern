import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Like JwtAuthGuard but never throws — if the request has no token or an
 * invalid token, req.user is simply left as undefined. Use this on endpoints
 * that are public but can optionally enrich behaviour for authenticated callers
 * (e.g. barcode scan auto-records history when a user is logged in).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleRequest<TUser = any>(_err: any, user: TUser): TUser {
    // Ignore errors / missing credentials — just return the user or undefined
    return user;
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
