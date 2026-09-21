import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

/** Tải ảnh thật lên Cloudinary nếu đã cấu hình (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET trong
 * .env). Nếu CHƯA cấu hình thì báo lỗi rõ ràng cho admin thay vì crash cả app lúc khởi động (cùng
 * kiểu phòng thủ như MailService/Google OAuth) - vì Railway không có ổ đĩa bền vững, ảnh sản phẩm
 * bắt buộc phải lưu ở dịch vụ ngoài, không lưu local. */
@Injectable()
export class CloudinaryService {
  private configured = false;

  constructor() {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
      cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
      });
      this.configured = true;
    }
  }

  get isConfigured() {
    return this.configured;
  }

  uploadImage(buffer: Buffer): Promise<string> {
    if (!this.configured) {
      throw new ServiceUnavailableException('Chưa cấu hình Cloudinary (thiếu biến môi trường CLOUDINARY_*).');
    }
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'smartfashion/products', resource_type: 'image' },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error('Tải ảnh lên Cloudinary thất bại.'));
          resolve(result.secure_url);
        },
      );
      stream.end(buffer);
    });
  }
}
