import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { AuthService } from '../services/auth.service';
import { KycService } from '../services/kyc.service';
import { UserService } from '../services/user.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import {
  RegisterDto,
  VerifyOtpDto,
  LoginDto,
  LoginPinDto,
  LoginBiometricDto,
  RefreshTokenDto,
  ForgotPinDto,
  ResetPinDto,
  SetPinDto,
  UpdateProfileDto,
  KycSubmitDto,
  AuthTokensDto,
  OtpSentDto,
} from '../dto/auth.dto';
import { User } from '@prisma/client';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private kycService: KycService,
    private userService: UserService,
  ) {}

  // ─── Registration & Verification ─────────────────────────────────────────

  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar nuevo usuario',
    description: 'Crea la cuenta y envía OTP de verificación por SMS',
  })
  @ApiResponse({ status: 201, type: OtpSentDto })
  @ApiResponse({ status: 409, description: 'Número de teléfono ya registrado' })
  async register(@Body() dto: RegisterDto): Promise<OtpSentDto> {
    return this.authService.register(dto);
  }

  @Post('verify-otp')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar OTP',
    description: 'Verifica el código OTP y activa la cuenta (o autentica en login)',
  })
  @ApiResponse({ status: 200, type: AuthTokensDto })
  @ApiResponse({ status: 401, description: 'OTP inválido o expirado' })
  async verifyOtp(@Body() dto: VerifyOtpDto): Promise<AuthTokensDto> {
    return this.authService.verifyOtp(dto);
  }

  // ─── Login ────────────────────────────────────────────────────────────────

  @Post('login')
  @Throttle({ default: { ttl: 900000, limit: 5 } }) // 5 attempts per 15 min
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login con teléfono y contraseña' })
  @ApiResponse({ status: 200, type: AuthTokensDto })
  @ApiResponse({ status: 401, description: 'Credenciales incorrectas' })
  async login(@Body() dto: LoginDto): Promise<AuthTokensDto> {
    return this.authService.login(dto);
  }

  @Post('login-pin')
  @Throttle({ default: { ttl: 900000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login rápido con PIN de 6 dígitos',
    description: 'Acceso rápido para uso en campo sin necesidad de contraseña completa',
  })
  @ApiResponse({ status: 200, type: AuthTokensDto })
  async loginWithPin(@Body() dto: LoginPinDto): Promise<AuthTokensDto> {
    return this.authService.loginWithPin(dto);
  }

  @Post('login-biometric')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login biométrico (huella dactilar)',
    description: 'Solo disponible en app móvil — requiere configuración previa',
  })
  async loginBiometric(@Body() dto: LoginBiometricDto) {
    // Biometric validation is handled on the device side.
    // The app sends a device-signed token which we validate here.
    return { message: 'Biometric login — implement device token validation' };
  }

  // ─── Token Management ─────────────────────────────────────────────────────

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access token usando refresh token' })
  @ApiResponse({ status: 200, type: AuthTokensDto })
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokensDto> {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar sesión' })
  async logout(
    @CurrentUser() user: User,
    @Body() dto: RefreshTokenDto,
  ): Promise<{ message: string }> {
    return this.authService.logout(user.id, dto.refreshToken);
  }

  // ─── PIN Management ───────────────────────────────────────────────────────

  @Post('set-pin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Configurar PIN de acceso rápido' })
  async setPin(@CurrentUser() user: User, @Body() dto: SetPinDto) {
    return this.authService.setPin(user.id, dto);
  }

  @Post('forgot-pin')
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recuperar PIN — envía OTP por SMS' })
  async forgotPin(@Body() dto: ForgotPinDto): Promise<OtpSentDto> {
    return this.authService.forgotPin(dto.phone);
  }

  @Post('reset-pin')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resetear PIN con OTP de verificación' })
  async resetPin(@Body() dto: ResetPinDto): Promise<{ message: string }> {
    return this.authService.resetPin(dto);
  }

  // ─── Profile ──────────────────────────────────────────────────────────────

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  async getMe(@CurrentUser() user: User) {
    return this.userService.getUserWithProfile(user.id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar perfil del usuario' })
  async updateProfile(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.userService.updateUser(user.id, dto);
  }

  // ─── KYC ─────────────────────────────────────────────────────────────────

  @Post('kyc/submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enviar documentos KYC',
    description: 'Sube foto del CI (anverso + reverso) y selfie para verificación de identidad',
  })
  async submitKyc(@CurrentUser() user: User, @Body() dto: KycSubmitDto) {
    return this.kycService.submitKyc(user.id, dto);
  }

  @Get('kyc/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consultar estado del proceso KYC' })
  async getKycStatus(@CurrentUser() user: User) {
    return this.kycService.getKycStatus(user.id);
  }
}
