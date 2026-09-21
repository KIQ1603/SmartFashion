import { IsEmail, IsIn, IsInt, IsOptional, IsString, Length, MinLength } from 'class-validator';

export class RequestRegisterOtpDto {
  @IsEmail()
  email: string;
}

export class RegisterDto {
  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsString()
  fullName: string;

  @IsOptional()
  @IsIn(['male', 'female', 'other'])
  gender?: 'male' | 'female' | 'other';

  @IsOptional()
  @IsInt()
  birthYear?: number;

  // Mã OTP gửi qua email lúc gọi /auth/register/otp - bắt buộc để chống đăng ký hàng loạt bằng
  // email không có thật/không phải của người dùng.
  @Length(6, 6)
  otp: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}
