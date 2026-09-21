import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

/** Gửi email thật qua SMTP nếu đã cấu hình (SMTP_HOST/SMTP_USER/SMTP_PASS trong .env - dùng được
 * với Gmail App Password, Resend SMTP, Mailtrap, hay bất kỳ provider SMTP nào, không khóa cứng
 * vào 1 SDK riêng). Nếu CHƯA cấu hình (vd. mới deploy demo, chưa kịp điền SMTP) thì log nội dung
 * mail ra console thay vì lỗi cứng - luồng OTP vẫn dùng thử được qua log, không chặn toàn bộ
 * đăng ký chỉ vì thiếu SMTP. */
@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
    }
  }

  get isConfigured() {
    return !!this.transporter;
  }

  async send(to: string, subject: string, html: string) {
    if (!this.transporter) {
      // eslint-disable-next-line no-console
      console.log(`[mail:fallback - SMTP chưa cấu hình] to=${to} subject="${subject}"\n${html}`);
      return;
    }
    await this.transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, html });
  }
}
