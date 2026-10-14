import { INestApplication, NotFoundException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import request from 'supertest';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { UserRole } from '../src/common/enums/user-role.enum';
import { AuthenticatedUser } from '../src/common/interfaces/authenticated-user.interface';
import { Publicacion } from '../src/publicaciones/entities/publicacion.entity';
import { PublicacionesController } from '../src/publicaciones/publicaciones.controller';
import { PublicacionesService } from '../src/publicaciones/publicaciones.service';
import { UsersService } from '../src/users/users.service';

describe('PublicacionesController (HTTP)', () => {
  const secret = 'test-only-secret-with-at-least-32-characters';
  let app: INestApplication;
  let jwtService: JwtService;
  let currentUser: AuthenticatedUser;
  let publicacionesService: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  const publication = {
    id: 7,
    title: 'Título',
    content: 'Contenido',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    author: { id: 1, name: 'Ada Lovelace' },
  } as Publicacion;

  async function tokenFor(user: AuthenticatedUser): Promise<string> {
    currentUser = user;
    return jwtService.signAsync({}, { subject: String(user.id) });
  }

  beforeAll(async () => {
    currentUser = {
      id: 1,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: UserRole.USUARIO,
    };
    publicacionesService = {
      create: jest.fn().mockResolvedValue(publication),
      findAll: jest.fn().mockResolvedValue([publication]),
      findOne: jest.fn().mockResolvedValue(publication),
      update: jest.fn().mockResolvedValue(publication),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({ secret }),
      ],
      controllers: [PublicacionesController],
      providers: [
        JwtAuthGuard,
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => secret },
        },
        {
          provide: UsersService,
          useValue: {
            findByIdForAuth: jest.fn(async (id: number) => ({
              ...currentUser,
              id,
              role: { name: currentUser.role },
            })),
          },
        },
        { provide: PublicacionesService, useValue: publicacionesService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
    jwtService = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires authentication to create a publication', async () => {
    await request(app.getHttpServer())
      .post('/publications')
      .send({ title: 'Título', content: 'Contenido' })
      .expect(401);
  });

  it('creates with the authenticated identity and rejects client-supplied author fields', async () => {
    const token = await tokenFor(currentUser);
    await request(app.getHttpServer())
      .post('/publications')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Título', content: 'Contenido' })
      .expect(201);

    expect(publicacionesService.create).toHaveBeenCalledWith(
      { title: 'Título', content: 'Contenido' },
      currentUser,
    );

    await request(app.getHttpServer())
      .post('/publications')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Título', content: 'Contenido', authorId: 99 })
      .expect(400);
  });

  it('validates required title and content', async () => {
    const token = await tokenFor(currentUser);

    await request(app.getHttpServer())
      .post('/publications')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '  ', content: '' })
      .expect(400);
  });

  it('lists publications and retrieves a publication by id', async () => {
    const serializedPublication = {
      ...publication,
      createdAt: publication.createdAt.toISOString(),
    };
    await request(app.getHttpServer())
      .get('/publications')
      .expect(200)
      .expect([serializedPublication]);
    await request(app.getHttpServer())
      .get('/publications/7')
      .expect(200)
      .expect(serializedPublication);
  });

  it('returns 404 when the requested publication is absent', async () => {
    publicacionesService.findOne.mockRejectedValueOnce(
      new NotFoundException('Publicación no encontrada.'),
    );

    await request(app.getHttpServer()).get('/publications/404').expect(404);
  });
});