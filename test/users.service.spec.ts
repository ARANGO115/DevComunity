import { ConflictException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { QueryFailedError, Repository } from 'typeorm';
import { Reaccion } from '../src/reacciones/entities/reaccion.entity';
import { RolesController } from '../src/roles/roles.controller';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { UserRole } from '../src/common/enums/user-role.enum';
import { Role } from '../src/roles/entities/role.entity';
import { RolesService } from '../src/roles/roles.service';
import { ROLES_KEY } from '../src/common/decorators/roles.decorator';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { UsersController } from '../src/users/users.controller';
import { User } from '../src/users/entities/user.entity';
import { UsersService } from '../src/users/users.service';

describe('UsersService managed operations', () => {
  let service: UsersService;
  let usersRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    find: jest.Mock;
    remove: jest.Mock;
    manager: { transaction: jest.Mock };
  };
  let transactionUsersRepository: {
    findOne: jest.Mock;
    remove: jest.Mock;
  };
  let transactionReactionsRepository: { count: jest.Mock };
  let rolesService: { findByName: jest.Mock };

  const user = {
    id: 7,
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    role: { id: 3, name: UserRole.USUARIO },
    createdAt: new Date('2026-10-14T12:00:00.000Z'),
  } as User;

  beforeEach(() => {
    usersRepository = {
      create: jest.fn((value) => ({ ...user, ...value })),
      save: jest.fn(async (value) => ({ ...user, ...value, id: user.id })),
      findOne: jest.fn(async () => user),
      find: jest.fn(async () => [user]),
      remove: jest.fn(async () => user),
      manager: { transaction: jest.fn() },
    };
    transactionUsersRepository = {
      findOne: jest.fn(async () => user),
      remove: jest.fn(async () => user),
    };
    transactionReactionsRepository = { count: jest.fn(async () => 0) };
    usersRepository.manager.transaction.mockImplementation(
      async (callback: (manager: { getRepository: jest.Mock }) => unknown) =>
        callback({
          getRepository: jest.fn((entity) =>
            entity === User
              ? transactionUsersRepository
              : entity === Reaccion
                ? transactionReactionsRepository
                : undefined,
          ),
        }),
    );
    rolesService = {
      findByName: jest.fn(
        async () =>
          ({
            id: 3,
            name: UserRole.USUARIO,
          }) as Role,
      ),
    };
    service = new UsersService(
      usersRepository as unknown as Repository<User>,
      rolesService as unknown as RolesService,
    );
  });

  it('creates an account with a bcrypt hash and a safe response', async () => {
    const response = await service.createManaged({
      name: 'Ada Lovelace',
      email: 'ADA@example.com ',
      password: 'correct-horse-battery',
    });
    const insertedUser = usersRepository.create.mock.calls[0][0];

    expect(insertedUser.email).toBe('ada@example.com');
    expect(insertedUser.passwordHash).not.toBe('correct-horse-battery');
    await expect(
      bcrypt.compare('correct-horse-battery', insertedUser.passwordHash),
    ).resolves.toBe(true);
    expect(response).toEqual({
      id: 7,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: UserRole.USUARIO,
      createdAt: user.createdAt,
    });
    expect(response).not.toHaveProperty('passwordHash');
  });

  it('translates duplicate email errors to a conflict', async () => {
    usersRepository.save.mockRejectedValueOnce(
      new QueryFailedError(
        'INSERT INTO users',
        [],
        Object.assign(new Error('duplicate'), { code: 'ER_DUP_ENTRY' }),
      ),
    );

    await expect(
      service.createManaged({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'correct-horse-battery',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('refuses to delete the requesting administrator account', async () => {
    await expect(service.removeManaged(7, 7)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(usersRepository.remove).not.toHaveBeenCalled();
  });

  it('refuses to delete an account that owns reactions', async () => {
    transactionReactionsRepository.count.mockResolvedValueOnce(1);

    await expect(service.removeManaged(7, 11)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(transactionUsersRepository.remove).not.toHaveBeenCalled();
  });

  it('never includes a password hash in user listings', async () => {
    const response = await service.findAll();

    expect(response).toHaveLength(1);
    expect(response[0]).not.toHaveProperty('passwordHash');
    expect(response[0]).not.toHaveProperty('password');
  });

  it('protects user and role administration with JWT and ADMIN role guards', () => {
    for (const controller of [UsersController, RolesController]) {
      expect(Reflect.getMetadata(GUARDS_METADATA, controller)).toEqual([
        JwtAuthGuard,
        RolesGuard,
      ]);
      expect(Reflect.getMetadata(ROLES_KEY, controller)).toEqual([
        UserRole.ADMIN,
      ]);
    }
  });
});
