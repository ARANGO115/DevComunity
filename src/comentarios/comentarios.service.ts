import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { AuthenticatedUser } from "../common/interfaces/authenticated-user.interface";
import { UserRole } from "../common/enums/user-role.enum";
import { ComentarioResponseDto } from "./dto/comentario-response.dto";
import { CreateComentarioDto } from "./dto/create-comentario.dto";
import { UpdateComentarioDto } from "./dto/update-comentario.dto";
import { Comentario } from "./entities/comentario.entity";

@Injectable()
export class ComentariosService {
  constructor(
    @InjectRepository(Comentario)
    private readonly comentariosRepository: Repository<Comentario>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    publicationId: number,
    dto: CreateComentarioDto,
    author: AuthenticatedUser,
  ): Promise<ComentarioResponseDto> {
    await this.ensurePublicationExists(publicationId);

    const comentario = this.comentariosRepository.create({
      content: dto.content,
      publicationId,
      author: { id: author.id },
    });
    const savedComentario = await this.comentariosRepository.save(comentario);
    return this.toResponse(await this.findCommentOrThrow(savedComentario.id));
  }

  async findByPublication(
    publicationId: number,
  ): Promise<ComentarioResponseDto[]> {
    await this.ensurePublicationExists(publicationId);
    const comentarios = await this.comentariosRepository.find({
      where: { publicationId },
      relations: { author: true },
      order: { createdAt: "ASC", id: "ASC" },
    });
    return comentarios.map((comentario) => this.toResponse(comentario));
  }

  async update(
    id: number,
    dto: UpdateComentarioDto,
    user: AuthenticatedUser,
  ): Promise<ComentarioResponseDto> {
    const comentario = await this.findCommentOrThrow(id);
    this.ensureAuthor(comentario, user);

    comentario.content = dto.content;
    await this.comentariosRepository.save(comentario);
    return this.toResponse(await this.findCommentOrThrow(comentario.id));
  }

  async remove(id: number, user: AuthenticatedUser): Promise<void> {
    const comentario = await this.findCommentOrThrow(id);
    if (comentario.author.id !== user.id && user.role !== UserRole.MODERADOR) {
      throw new ForbiddenException(
        "Solo el autor o un moderador puede eliminar este comentario.",
      );
    }

    await this.comentariosRepository.remove(comentario);
  }

  private async ensurePublicationExists(publicationId: number): Promise<void> {
    if (!Number.isSafeInteger(publicationId) || publicationId <= 0) {
      throw new BadRequestException(
        "El identificador de publicación no es válido.",
      );
    }

    const publications: Array<{ id: number }> = await this.dataSource.query(
      "SELECT `id` FROM `publications` WHERE `id` = ? LIMIT 1",
      [publicationId],
    );
    if (publications.length === 0) {
      throw new NotFoundException("La publicación no existe.");
    }
  }

  private async findCommentOrThrow(id: number): Promise<Comentario> {
    const comentario = await this.comentariosRepository.findOne({
      where: { id },
      relations: { author: true },
    });
    if (!comentario) {
      throw new NotFoundException("El comentario no existe.");
    }

    return comentario;
  }

  private ensureAuthor(comentario: Comentario, user: AuthenticatedUser): void {
    if (comentario.author.id !== user.id) {
      throw new ForbiddenException("No puedes editar un comentario ajeno.");
    }
  }

  private toResponse(comentario: Comentario): ComentarioResponseDto {
    return {
      id: comentario.id,
      content: comentario.content,
      publicationId: comentario.publicationId,
      author: {
        id: comentario.author.id,
        name: comentario.author.name,
      },
      createdAt: comentario.createdAt,
      updatedAt: comentario.updatedAt,
    };
  }
}
