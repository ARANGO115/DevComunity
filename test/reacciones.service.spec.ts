import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError, Repository } from 'typeorm';
import { Publicacion } from '../src/publicaciones/entities/publicacion.entity';
import { Reaccion } from '../src/reacciones/entities/reaccion.entity';
import { ReaccionesService } from '../src/reacciones/reacciones.service';

describe('ReaccionesService', () => {
  let service: ReaccionesService;
  let reaccionesRepository: {
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };
  let publicacionesRepository: { findOne: jest.Mock };

  beforeEach(() => {
    reaccionesRepository = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ id: 1, ...value })),
      delete: jest.fn(async () => ({ affected: 1 })),
      count: jest.fn(async () => 3),
    };
    publicacionesRepository = {
      findOne: jest.fn(async () => ({ id: 7 })),
    };
    service = new ReaccionesService(
      reaccionesRepository as unknown as Repository<Reaccion>,
      publicacionesRepository as unknown as Repository<Publicacion>,
    );
  });

  it('rejects a like when the publication does not exist', async () => {
    publicacionesRepository.findOne.mockResolvedValueOnce(null);

    await expect(service.create(7, 11)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(reaccionesRepository.save).not.toHaveBeenCalled();
  });

  it('translates a database duplicate into a conflict', async () => {
    reaccionesRepository.save.mockRejectedValueOnce(
      new QueryFailedError(
        'INSERT INTO reacciones',
        [],
        Object.assign(new Error('duplicate'), { code: 'ER_DUP_ENTRY' }),
      ),
    );

    await expect(service.create(7, 11)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('removes only the authenticated user like', async () => {
    await service.remove(7, 11);

    expect(reaccionesRepository.delete).toHaveBeenCalledWith({
      publication: { id: 7 },
      user: { id: 11 },
    });
  });

  it('returns the total likes after checking the publication', async () => {
    await expect(service.count(7)).resolves.toEqual({
      publicationId: 7,
      count: 3,
    });
  });
});
