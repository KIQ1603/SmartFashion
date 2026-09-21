import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtUserPayload {
  userId: string;
  email: string;
  role: 'customer' | 'admin';
}

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext): JwtUserPayload | undefined => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
