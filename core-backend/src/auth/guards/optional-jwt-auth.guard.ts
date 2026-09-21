import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Dùng cho các route cho phép cả Guest lẫn Customer (vd: trang chủ, ghi nhận interaction).
 * Nếu có JWT hợp lệ -> gắn req.user; nếu không có/không hợp lệ -> vẫn cho qua, req.user = undefined.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context) as any;
  }

  handleRequest(err: any, user: any) {
    return user || undefined;
  }
}
