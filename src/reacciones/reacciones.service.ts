import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Publicacion } from '../publicaciones/entities/publicacion.entity';
import { Reaccion } from './entities/reaccion.entity';

@Injectable()
export class ReaccionesService {
  constructor(
    @InjectRepository(Reaccion)
    private readonly reaccionesRepository: Repository<Reaccion>,
    @InjectRepository(Publicacion)
    private readonly publicacionesRepository: Repository<Publicacion>,
  ) {}

  async create(publicationId: number, userId: number): Promise<Reaccion> {
    const publication = await this.publicacionesRepository.findOne({
      where: { id: publicationId },
    });
    if (!publication) {
      throw new NotFoundException('La publicación no existe.');
    }

    const reaccion = this.reaccionesRepository.create({
      user: { id: userId },
      publication: { id: publicationId },
    });

    try {
      return await this.reaccionesRepository.save(reaccion);
    } catch (error) {
      if (error instanceof QueryFailedError && this.isUniqueViolation(error)) {
        throw new ConflictException(
          'El usuario ya indicó que le gusta esta publicación.',
        );
      }
      throw error;
    }
  }

  async remove(publicationId: number, userId: number): Promise<void> {
    const result = await this.reaccionesRepository.delete({
      publication: { id: publicationId },
      user: { id: userId },
    });
    if (!result.affected) {
      throw new NotFoundException('El usuario no indicó que le gusta esta publicación.');
    }
  }

  async count(publicationId: number): Promise<{ publicationId: number; count: number }> {
    const publication = await this.publicacionesRepository.findOne({
      where: { id: publicationId },
    });
    if (!publication) {
      throw new NotFoundException('La publicación no existe.');
    }

    const count = await this.reaccionesRepository.count({
      where: { publication: { id: publicationId } },
    });
    return { publicationId, count };
  }

  private isUniqueViolation(error: QueryFailedError): boolean {
    const driverError = error.driverError as { code?: string };
    return (
      driverError.code === 'ER_DUP_ENTRY' ||
      driverError.code === '23505' ||
      (error.driverError as { errno?: number }).errno === 1062
    );
  }
}