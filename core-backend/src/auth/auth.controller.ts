import { BadRequestException, Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ForgotPasswordDto, LoginDto, RegisterDto, RequestRegisterOtpDto } from './dto/auth.dto';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser, JwtUserPayload } from './decorators/current-user.decorator';

const REFRESH_COOKIE = 'refresh_token';
const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/api/v1/auth',
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Public info cho frontend biết có nên hiện nút "Đăng nhập với Google" hay không - tránh hiện
  // nút bấm vào là lỗi khi server chưa cấu hình Client ID/Secret (vd. vừa deploy demo).
  @Public()
  @Get('providers')
  providers() {
    return { google: !!process.env.GOOGLE_CLIENT_ID };
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('register/otp')
  requestRegisterOtp(@Body() dto: RequestRegisterOtpDto) {
    return this.authService.requestRegisterOtp(dto.email);
  }

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, user } = await this.authService.register(dto);
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
    return { user, accessToken };
  }

  // GET (không phải POST) vì đây là bước redirect trình duyệt sang Google, không phải gọi API
  // thuần từ JS - res.redirect thẳng, không dùng passport-google-oauth20 (strategy đó throw ngay
  // lúc khởi động nếu thiếu Client ID, sẽ sập cả server khi chưa kịp cấu hình).
  @Public()
  @Get('google')
  googleLogin(@Res() res: Response) {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CALLBACK_URL) {
      throw new BadRequestException('Đăng nhập Google chưa được cấu hình trên máy chủ.');
    }
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL,
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
    });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  }

  @Public()
  @Get('google/callback')
  async googleCallback(@Query('code') code: string, @Res() res: Response) {
    const storefrontOrigin = process.env.STOREFRONT_ORIGIN || 'http://localhost:3000';
    try {
      const { accessToken, refreshToken } = await this.authService.loginWithGoogle(code);
      res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
      // Chuyển accessToken qua URL cho trang /auth/callback ở frontend đọc rồi lưu vào store -
      // token này sống rất ngắn (JWT_ACCESS_EXPIRES, mặc định 15p) nên rủi ro lộ qua lịch sử trình
      // duyệt/log server thấp, refresh_token thật (dài hạn) đã nằm trong cookie httpOnly ở trên.
      res.redirect(`${storefrontOrigin}/auth/callback?accessToken=${encodeURIComponent(accessToken)}`);
    } catch (err: any) {
      res.redirect(`${storefrontOrigin}/auth/callback?error=${encodeURIComponent(err.message || 'Đăng nhập Google thất bại.')}`);
    }
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const sessionId = (req.headers['x-session-id'] as string) || undefined;
    const { accessToken, refreshToken, user } = await this.authService.login(dto, sessionId);
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
    return { user, accessToken };
  }

  @Public()
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE];
    const { accessToken, refreshToken } = await this.authService.refresh(token);
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
    return { accessToken };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@CurrentUser() user: JwtUserPayload, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(user.userId);
    res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
    return { success: true };
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }
}
