import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { MailService } from './mail.service';
import { CloudinaryService } from './cloudinary.service';

@Global()
@Module({
  providers: [RedisService, MailService, CloudinaryService],
  exports: [RedisService, MailService, CloudinaryService],
})
export class CommonModule {}
