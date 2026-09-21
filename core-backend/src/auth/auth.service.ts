import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis.service';
import { MailService } from '../common/mail.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

const OTP_TTL_SECONDS = 300; // 5 phút
const OTP_MAX_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private redis: RedisService,
    private mail: MailService,
  ) {}

  private async issueTokens(user: { id: string; email: string; role: string }) {
    const payload = { userId: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'change_me_access_secret',
      expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    });

    const refreshToken = this.jwtService.sign(
      { ...payload, jti: uuidv4() },
      {
        secret: process.env.JWT_REFRESH_SECRET || 'change_me_refresh_secret',
        expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
      },
    );

    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    return { accessToken, refreshToken };
  }

  // Merge interactions/cart theo session_id vào user_id sau khi đăng nhập (mục 3.2 đặc tả)
  private async mergeGuestSession(userId: string, sessionId?: string) {
    if (!sessionId) return;

    await this.prisma.userInteraction.updateMany({
      where: { sessionId, userId: null },
      data: { userId, sessionId: null },
    });

    const guestCart = await this.prisma.cart.findUnique({
      where: { sessionId },
      include: { items: true },
    });
    if (!guestCart) return;

    const userCart = await this.prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    for (const item of guestCart.items) {
      await this.prisma.cartItem.upsert({
        where: { cartId_variantId: { cartId: userCart.id, variantId: item.variantId } },
        update: { quantity: { increment: item.quantity } },
        create: { cartId: userCart.id, variantId: item.variantId, quantity: item.quantity },
      });
    }
    await this.prisma.cart.delete({ where: { id: guestCart.id } });
  }

  private otpKey(email: string) {
    return `otp:register:${email.toLowerCase()}`;
  }

  // Gửi mã OTP 6 số qua email trước khi cho đăng ký - chặn tạo tài khoản hàng loạt bằng email rác
  // (đặc biệt quan trọng khi đã mở thêm đăng nhập Google, tránh 2 luồng đăng ký lệch mức xác thực
  // nhau). Lưu trong Redis với TTL 5 phút, không cần bảng riêng trong Postgres.
  async requestRegisterOtp(email: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email đã được sử dụng.');

    const code = String(Math.floor(100000 + Math.random() * 900000));
    await this.redis.setJSON(this.otpKey(email), { code, attempts: 0 }, OTP_TTL_SECONDS);

    await this.mail.send(
      email,
      'Mã xác thực đăng ký SmartFashion',
      `<p>Mã xác thực của bạn là: <strong style="font-size:20px">${code}</strong></p><p>Mã có hiệu lực trong 5 phút.</p>`,
    );
    return { success: true, message: 'Đã gửi mã xác thực tới email của bạn.' };
  }

  private async verifyRegisterOtp(email: string, otp: string) {
    const key = this.otpKey(email);
    const record = await this.redis.getJSON<{ code: string; attempts: number }>(key);
    if (!record) throw new BadRequestException('Mã xác thực đã hết hạn hoặc chưa được gửi.');
    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      await this.redis.del(key);
      throw new BadRequestException('Bạn đã nhập sai quá nhiều lần, vui lòng yêu cầu mã mới.');
    }
    if (record.code !== otp) {
      await this.redis.setJSON(key, { ...record, attempts: record.attempts + 1 }, OTP_TTL_SECONDS);
      throw new BadRequestException('Mã xác thực không đúng.');
    }
    await this.redis.del(key);
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email đã được sử dụng.');
    await this.verifyRegisterOtp(dto.email, dto.otp);

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        gender: dto.gender,
        birthYear: dto.birthYear,
      },
    });

    // Không await chặn response, không để lỗi gửi mail (SMTP lỗi mạng...) làm hỏng cả luồng đăng
    // ký - tài khoản đã tạo xong trong DB rồi, thiếu mail chào mừng không nghiêm trọng bằng việc
    // trả lỗi cho một tài khoản thực ra đã tạo thành công.
    this.mail
      .send(
        user.email,
        'Chào mừng bạn đến với SmartFashion',
        `<p>Xin chào ${user.fullName},</p><p>Cảm ơn bạn đã tạo tài khoản tại SmartFashion. Giờ đây bạn có thể khám phá sản phẩm, lưu danh sách yêu thích và nhận gợi ý cá nhân hóa theo đúng phong cách của mình.</p>`,
      )
      .catch(() => {});

    const tokens = await this.issueTokens(user);
    return { user: this.sanitize(user), ...tokens };
  }

  async login(dto: LoginDto, sessionId?: string) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.isActive) throw new UnauthorizedException('Email hoặc mật khẩu không đúng.');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Email hoặc mật khẩu không đúng.');

    await this.mergeGuestSession(user.id, sessionId);

    const tokens = await this.issueTokens(user);
    return { user: this.sanitize(user), ...tokens };
  }

  async refresh(refreshToken: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'change_me_refresh_secret',
      });
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn.');
    }

    const tokens = await this.prisma.refreshToken.findMany({
      where: { userId: payload.userId, revoked: false },
      orderBy: { createdAt: 'desc' },
    });

    let matched: (typeof tokens)[number] | null = null;
    for (const t of tokens) {
      if (await bcrypt.compare(refreshToken, t.tokenHash)) {
        matched = t;
        break;
      }
    }
    if (!matched || matched.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã bị thu hồi.');
    }

    await this.prisma.refreshToken.update({ where: { id: matched.id }, data: { revoked: true } });

    const user = await this.prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) throw new UnauthorizedException();

    return this.issueTokens(user);
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({ where: { userId, revoked: false }, data: { revoked: true } });
    return { success: true };
  }

  // Dùng thẳng HTTPS API của Google (không qua passport-google-oauth20) - tránh phải đăng ký thêm
  // 1 Passport strategy có thể throw lúc khởi động app nếu GOOGLE_CLIENT_ID chưa cấu hình (vd. mới
  // deploy demo, chưa kịp tạo OAuth app) - endpoint chỉ ném lỗi rõ ràng khi thực sự bị gọi, không
  // làm sập cả server.
  async loginWithGoogle(code: string) {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CALLBACK_URL) {
      throw new NotFoundException('Đăng nhập Google chưa được cấu hình trên máy chủ.');
    }
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData: any = await tokenRes.json();
    if (!tokenData.access_token) throw new UnauthorizedException('Đăng nhập Google thất bại.');

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile: any = await profileRes.json();
    if (!profile.email) throw new UnauthorizedException('Không lấy được email từ tài khoản Google.');

    let user = await this.prisma.user.findUnique({ where: { email: profile.email } });
    if (!user) {
      // Tài khoản qua Google không có mật khẩu thật - sinh hash ngẫu nhiên không ai đoán được, để
      // không phải nới lỏng passwordHash thành nullable (tránh migrate + ảnh hưởng chỗ khác đang
      // giả định field này luôn có giá trị).
      const randomPasswordHash = await bcrypt.hash(uuidv4(), 10);
      user = await this.prisma.user.create({
        data: { email: profile.email, passwordHash: randomPasswordHash, fullName: profile.name || profile.email },
      });
      this.mail
        .send(
          user.email,
          'Chào mừng bạn đến với SmartFashion',
          `<p>Xin chào ${user.fullName},</p><p>Cảm ơn bạn đã tạo tài khoản tại SmartFashion bằng Google. Giờ đây bạn có thể khám phá sản phẩm, lưu danh sách yêu thích và nhận gợi ý cá nhân hóa theo đúng phong cách của mình.</p>`,
        )
        .catch(() => {});
    }
    if (!user.isActive) throw new UnauthorizedException('Tài khoản đã bị khóa.');

    const tokens = await this.issueTokens(user);
    return { user: this.sanitize(user), ...tokens };
  }

  async forgotPassword(email: string) {
    // MVP: chỉ log ra, chưa tích hợp gửi email thật (SMTP/SES...) - việc cần làm thêm.
    // eslint-disable-next-line no-console
    console.log(`[forgot-password] Gửi email khôi phục mật khẩu cho: ${email}`);
    return { success: true, message: 'Nếu email tồn tại, hướng dẫn khôi phục mật khẩu đã được gửi.' };
  }

  private sanitize(user: any) {
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
