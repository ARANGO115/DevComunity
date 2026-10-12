import { Controller, Get, INestApplication, Req, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import request from 'supertest';
import { Roles } from '../src/common/decorators/roles.decorator';
import { UserRole } from '../src/common/enums/user-role.enum';
import { AuthenticatedUser } from '../src/common/interfaces/authenticated-user.interface';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { UsersService } from '../src/users/users.service';

@Controller('guard-test')
class GuardTestController {
  @Get('protected')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  protectedRoute(@Req() req: Request & { user: AuthenticatedUser }) {
    return req.user;
  }

  @Get('admin')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  adminRoute() {
    return { ok: true };
  }
}

describe('JWT and role guards (integration)', () => {
  const secret = 'test-only-secret-with-at-least-32-characters';
  let app: INestApplication;
  let jwtService: JwtService;
  let currentUser: AuthenticatedUser;

  beforeAll(async () => {
    currentUser = {
      id: 12,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: UserRole.USUARIO,
    };
    const moduleRef = await Test.createTestingModule({
      imports: [PassportModule.register({ defaultStrategy: 'jwt' }), JwtModule.register({ secret })],
      controllers: [GuardTestController],
      providers: [
        JwtAuthGuard,
        RolesGuard,
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => secret },
        },
        {
          provide: UsersService,
          useValue: {
            findByIdForAuth: jest.fn(async () => ({
              ...currentUser,
              role: { name: currentUser.role },
            })),
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    jwtService = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects requests with no bearer token', async () => {
    await request(app.getHttpServer()).get('/guard-test/protected').expect(401);
  });

  it('validates the token and attaches the current user to request.user', async () => {
    const token = await jwtService.signAsync({}, { subject: String(currentUser.id) });

    await request(app.getHttpServer())
      .get('/guard-test/protected')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(currentUser);
        expect(body).not.toHaveProperty('passwordHash');
      });
  });

  it('forbids authenticated users without the required role', async () => {
    const token = await jwtService.signAsync({}, { subject: String(currentUser.id) });

    await request(app.getHttpServer())
      .get('/guard-test/admin')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('allows an authenticated user with the required role', async () => {
    currentUser = { ...currentUser, role: UserRole.ADMIN };
    const token = await jwtService.signAsync({}, { subject: String(currentUser.id) });

    await request(app.getHttpServer())
      .get('/guard-test/admin')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect({ ok: true });
  });
});
