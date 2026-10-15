import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserRole } from '../src/common/enums/user-role.enum';
import { AuthenticatedUser } from '../src/common/interfaces/authenticated-user.interface';
import { Publicacion } from '../src/publicaciones/entities/publicacion.entity';
import { PublicacionesService } from '../src/publicaciones/publicaciones.service';

describe('PublicacionesService', () => {
  let service: PublicacionesService;
  let repository: {
    create: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };

  const author: AuthenticatedUser = {
    id: 1,
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    role: UserRole.USUARIO,
  };
  const otherUser: AuthenticatedUser = { ...author, id: 2 };
  const admin: AuthenticatedUser = { ...otherUser, role: UserRole.ADMIN };
  const moderator: AuthenticatedUser = { ...otherUser, role: UserRole.MODERADOR };
  const publication = {
    id: 7,
    title: 'Título',
    content: 'Contenido',
    author: { id: author.id },
  } as Publicacion;

  beforeEach(() => {
    repository = {
      create: jest.fn((input) => input),
      find: jest.fn().mockResolvedValue([publication]),
      findOne: jest.fn().mockResolvedValue(publication),
      save: jest.fn(async (input) => ({ ...input, id: publication.id })),
      remove: jest.fn().mockResolvedValue(publication),
    };
    service = new PublicacionesService(repository as unknown as Repository<Publicacion>);
  });

  it('creates a publication using the authenticated user as author', async () => {
    await service.create({ title: 'Título', content: 'Contenido' }, author);

    expect(repository.create).toHaveBeenCalledWith({
      title: 'Título',
      content: 'Contenido',
      author: { id: author.id },
    });
    expect(repository.save).toHaveBeenCalled();
  });

  it('lists publications and returns one publication by id', async () => {
    await expect(service.findAll()).resolves.toEqual([publication]);
    await expect(service.findOne(publication.id)).resolves.toBe(publication);
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: publication.id },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        author: { id: true, name: true },
      },
      relations: { author: true },
    });
  });

  it('returns 404 when a publication does not exist', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findOne(404)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('allows the author to edit and permits ADMIN to edit another user publication', async () => {
    await service.update(publication.id, { title: 'Editada' }, author);
    await service.update(publication.id, { content: 'Moderada' }, admin);

    expect(repository.save).toHaveBeenCalledTimes(2);
  });

  it('rejects edits by another user and rejects an empty partial update', async () => {
    await expect(
      service.update(publication.id, { title: 'No permitido' }, otherUser),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.update(publication.id, { title: 'No permitido' }, moderator),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.update(publication.id, {}, author)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it.each([author, moderator, admin])('allows authorized user %s to delete', async (user) => {
    await service.remove(publication.id, user);

    expect(repository.remove).toHaveBeenCalledWith(publication);
  });

  it('rejects deletion by another regular user', async () => {
    await expect(service.remove(publication.id, otherUser)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(repository.remove).not.toHaveBeenCalled();
  });
});