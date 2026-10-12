import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../src/common/enums/user-role.enum';
import { Role } from '../src/roles/entities/role.entity';
import { RolesService } from '../src/roles/roles.service';
import { User } from '../src/users/entities/user.entity';
import { UsersService } from '../src/users/users.service';
import { AuthService } from '../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: {
    findByEmailForAuth: jest.Mock;
    create: jest.Mock;
  };
  let rolesService: { findByName: jest.Mock };
  let jwtService: { signAsync: jest.Mock };

  const publicUser = {
    id: 1,
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    role: { id: 3, name: UserRole.USUARIO },
  } as User;

  beforeEach(() => {
    usersService = {
      findByEmailForAuth: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(async (user) => ({
        ...publicUser,
        ...user,
      })),
    };
    rolesService = {
      findByName: jest
        .fn()
        .mockResolvedValue({ id: 3, name: UserRole.USUARIO } as Role),
    };
    jwtService = { signAsync: jest.fn().mockResolvedValue('signed.jwt.token') };
    authService = new AuthService(
      usersService as unknown as UsersService,
      rolesService as unknown as RolesService,
      jwtService as unknown as JwtService,
    );
  });

  it('registers with a bcrypt hash and returns no password data', async () => {
    const result = await authService.register({
      name: 'Ada Lovelace',
      email: 'ADA@example.com ',
      password: 'correct-horse-battery',
    });
    const savedUser = usersService.create.mock.calls[0][0];

    expect(savedUser.email).toBe('ada@example.com');
    expect(savedUser.passwordHash).not.toBe('correct-horse-battery');
    expect(await bcrypt.compare('correct-horse-battery', savedUser.passwordHash)).toBe(true);
    expect(result).toEqual({
      id: 1,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: UserRole.USUARIO,
    });
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('rejects an already registered email', async () => {
    usersService.findByEmailForAuth.mockResolvedValue(publicUser);

    await expect(
      authService.register({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'correct-horse-battery',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(usersService.create).not.toHaveBeenCalled();
  });

  it('returns a signed bearer token and safe user data on login', async () => {
    const passwordHash = await bcrypt.hash('correct-horse-battery', 4);
    usersService.findByEmailForAuth.mockResolvedValue({
      ...publicUser,
      passwordHash,
    });

    const result = await authService.login({
      email: 'ADA@example.com',
      password: 'correct-horse-battery',
    });

    expect(jwtService.signAsync).toHaveBeenCalledWith(
      { email: 'ada@example.com', role: UserRole.USUARIO },
      { subject: '1' },
    );
    expect(result).toEqual({
      access_token: 'signed.jwt.token',
      token_type: 'Bearer',
      user: {
        id: 1,
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        role: UserRole.USUARIO,
      },
    });
    expect(JSON.stringify(result)).not.toContain('passwordHash');
  });

  it('does not reveal whether the email or password was incorrect', async () => {
    usersService.findByEmailForAuth.mockResolvedValue(null);

    await expect(
      authService.login({ email: 'unknown@example.com', password: 'password' }),
    ).rejects.toThrow(new UnauthorizedException('Credenciales inválidas.'));
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });
});
