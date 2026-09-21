import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

// UserInteraction.id là BigInt (Prisma autoincrement) - JSON.stringify() gốc của Node không
// serialize được BigInt và ném TypeError, khiến mọi response trả về bản ghi interaction (vd.
// POST /interactions) lỗi 500 "Đã có lỗi xảy ra ở máy chủ" dù dữ liệu đã ghi thành công vào DB.
// Đăng ký toJSON() một lần ở đây để toàn bộ app serialize BigInt an toàn thành string.
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());
  app.enableCors({
    origin: [process.env.STOREFRONT_ORIGIN || 'http://localhost:3000', process.env.ADMIN_ORIGIN || 'http://localhost:5173'],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.CORE_BACKEND_PORT || 4000;
  await app.listen(port);
  // Cổng NỘI BỘ container tự lắng nghe - không phải domain public thật (local hay Render đều in
  // y hệt dòng này). Ghi rõ "cổng nội bộ" để không hiểu nhầm là server đang chạy sai chỗ khi xem
  // log deploy trên Render.
  // eslint-disable-next-line no-console
  console.log(`Core Backend đã khởi động, lắng nghe cổng nội bộ ${port} (đường dẫn API: /api/v1)`);
}
bootstrap();
