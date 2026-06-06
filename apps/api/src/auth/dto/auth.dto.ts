import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsBoolean,
  MinLength,
  MaxLength,
  Matches,
  IsNotEmpty,
  IsNumberString,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

// ─── Register ────────────────────────────────────────────────────────────────

export class RegisterDto {
  @ApiProperty({ example: '+59170000000', description: 'Número de teléfono boliviano' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9]{8,15}$/, { message: 'Número de teléfono inválido' })
  phone: string;

  @ApiPropertyOptional({ example: 'productor@email.com' })
  @IsEmail({}, { message: 'Email inválido' })
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'MiPassword123!', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(100)
  password: string;

  @ApiProperty({ enum: UserRole, example: 'PRODUCER' })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ example: 'es', description: 'Idioma preferido: es, ay, qu' })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  whatsappOptIn?: boolean;
}

// ─── Verify OTP ──────────────────────────────────────────────────────────────

export class VerifyOtpDto {
  @ApiProperty({ example: '+59170000000' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '123456', description: 'Código OTP de 6 dígitos' })
  @IsNumberString()
  @Length(6, 6, { message: 'El OTP debe tener exactamente 6 dígitos' })
  otp: string;

  @ApiProperty({ example: 'REGISTRATION', enum: ['REGISTRATION', 'LOGIN', 'TRANSACTION'] })
  @IsString()
  purpose: string;
}

// ─── Login ───────────────────────────────────────────────────────────────────

export class LoginDto {
  @ApiProperty({ example: '+59170000000' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'MiPassword123!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

// ─── Login PIN ───────────────────────────────────────────────────────────────

export class LoginPinDto {
  @ApiProperty({ example: '+59170000000' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '123456', description: 'PIN de 6 dígitos' })
  @IsNumberString()
  @Length(6, 6, { message: 'El PIN debe tener exactamente 6 dígitos' })
  pin: string;
}

// ─── Login Biometric ─────────────────────────────────────────────────────────

export class LoginBiometricDto {
  @ApiProperty({ description: 'Token firmado biométricamente por el dispositivo' })
  @IsString()
  @IsNotEmpty()
  biometricToken: string;

  @ApiProperty({ description: 'ID del dispositivo registrado' })
  @IsString()
  @IsNotEmpty()
  deviceId: string;
}

// ─── Refresh Token ───────────────────────────────────────────────────────────

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token JWT' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

// ─── Forgot PIN ──────────────────────────────────────────────────────────────

export class ForgotPinDto {
  @ApiProperty({ example: '+59170000000' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}

export class ResetPinDto {
  @ApiProperty({ example: '+59170000000' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '123456', description: 'OTP recibido por SMS' })
  @IsNumberString()
  @Length(6, 6)
  otp: string;

  @ApiProperty({ example: '654321', description: 'Nuevo PIN de 6 dígitos' })
  @IsNumberString()
  @Length(6, 6, { message: 'El PIN debe tener exactamente 6 dígitos' })
  newPin: string;
}

// ─── Set PIN ─────────────────────────────────────────────────────────────────

export class SetPinDto {
  @ApiProperty({ example: '123456' })
  @IsNumberString()
  @Length(6, 6)
  pin: string;
}

// ─── Update Profile ──────────────────────────────────────────────────────────

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'es', enum: ['es', 'ay', 'qu'] })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  whatsappOptIn?: boolean;
}

// ─── KYC Submit ──────────────────────────────────────────────────────────────

export class KycSubmitDto {
  @ApiProperty({ description: 'URL de imagen del anverso del CI (S3)' })
  @IsString()
  @IsNotEmpty()
  frontUrl: string;

  @ApiProperty({ description: 'URL de imagen del reverso del CI (S3)' })
  @IsString()
  @IsNotEmpty()
  backUrl: string;

  @ApiProperty({ description: 'URL de selfie con el CI (S3)' })
  @IsString()
  @IsNotEmpty()
  selfieUrl: string;
}

// ─── Response DTOs ───────────────────────────────────────────────────────────

export class AuthTokensDto {
  @ApiProperty({ description: 'JWT Access Token (válido 15 minutos)' })
  accessToken: string;

  @ApiProperty({ description: 'JWT Refresh Token (válido 30 días)' })
  refreshToken: string;

  @ApiProperty({ description: 'Datos básicos del usuario autenticado' })
  user: UserBasicDto;
}

export class UserBasicDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  email: string | null;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty()
  status: string;

  @ApiProperty()
  language: string;

  @ApiProperty()
  createdAt: Date;
}

export class OtpSentDto {
  @ApiProperty()
  message: string;

  @ApiProperty({ description: 'Segundos hasta que expira el OTP' })
  expiresIn: number;
}
