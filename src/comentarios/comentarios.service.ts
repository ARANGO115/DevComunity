import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuthenticatedUser } from "../common/interfaces/authenticated-user.interface";
import { UserRole } from "../common/enums/user-role.enum";
import { Publicacion } from "../publicaciones/entities/publicacion.entity";
import { ComentarioResponseDto } from "./dto/comentario-response.dto";
import { CreateComentarioDto } from "./dto/create-comentario.dto";
import { UpdateComentarioDto } from "./dto/update-comentario.dto";
import { Comentario } from "./entities/comentario.entity";

@Injectable()
export class ComentariosService {
  constructor(
    @InjectRepository(Comentario)
    private readonly comentariosRepository: Repository<Comentario>,
    @InjectRepository(Publicacion)
    private readonly publicacionesRepository: Repository<Publicacion>,
  ) {}

  async create(
    publicationId: number,
    dto: CreateComentarioDto,
    author: AuthenticatedUser,
  ): Promise<ComentarioResponseDto> {
    await this.ensurePublicationExists(publicationId);

    const comentario = this.comentariosRepository.create({
      content: dto.content,
      publication: { id: publicationId },
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
      where: { publication: { id: publicationId } },
      relations: { author: true, publication: true },
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
    const publicacion = await this.publicacionesRepository.findOneBy({
      id: publicationId,
    });
    if (!publicacion) {
      throw new NotFoundException("La publicación no existe.");
    }
  }

  private async findCommentOrThrow(id: number): Promise<Comentario> {
    const comentario = await this.comentariosRepository.findOne({
      where: { id },
      relations: { author: true, publication: true },
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
      publicationId: comentario.publication.id,
      author: {
        id: comentario.author.id,
        name: comentario.author.name,
      },
      createdAt: comentario.createdAt,
    };
  }
}
