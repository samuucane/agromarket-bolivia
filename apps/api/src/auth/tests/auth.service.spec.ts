import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { OtpService } from '../services/otp.service';
import { TokenService } from '../services/token.service';
import { PrismaService } from '../../database/prisma.service';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  },
  wallet: { create: jest.fn() },
};
const mockOtp = { sendOtp: jest.fn(), verifyOtp: jest.fn() };
const mockToken = { generateAuthTokens: jest.fn() };

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: OtpService, useValue: mockOtp },
        { provide: TokenService, useValue: mockToken },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register()', () => {
    it('should send OTP on successful registration', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ id: 'u1', phone: '+59170000001' });
      mockOtp.sendOtp.mockResolvedValue(undefined);

      const result = await service.register({
        phone: '+59170000001',
        password: 'Pass1234!',
        role: 'PRODUCER' as any,
      });

      expect(result.message).toContain('+59170000001');
      expect(result.expiresIn).toBe(300);
      expect(mockOtp.sendOtp).toHaveBeenCalledWith('+59170000001', 'REGISTRATION');
    });

    it('should throw ConflictException if phone exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(
        service.register({ phone: '+59170000001', password: 'Pass1234!', role: 'PRODUCER' as any })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login()', () => {
    it('should throw UnauthorizedException for wrong password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        phone: '+59170000001',
        passwordHash: '$2b$12$invalid',
        status: 'ACTIVE',
      });
      await expect(
        service.login({ phone: '+59170000001', password: 'Wrong!' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for pending verification', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        phone: '+59170000001',
        passwordHash: '$2b$12$valid',
        status: 'PENDING_VERIFICATION',
      });
      await expect(
        service.login({ phone: '+59170000001', password: 'Pass1234!' })
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
