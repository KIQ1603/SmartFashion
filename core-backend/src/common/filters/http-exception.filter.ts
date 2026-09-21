import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    // Lỗi 5xx không phải HttpException (bug thật trong code) trước đây bị nuốt im lặng, không có
    // dòng log nào - khiến việc dò lỗi (vd. TypeError serialize BigInt ở UserInteraction.id)
    // gần như không thể theo dõi qua `docker compose logs`. Luôn log kèm stack trace ở đây.
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception instanceof Error ? exception.stack : exception);
    }

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Đã có lỗi xảy ra ở máy chủ, vui lòng thử lại sau.';

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      error: typeof message === 'string' ? message : (message as any).message || message,
    });
  }
}
