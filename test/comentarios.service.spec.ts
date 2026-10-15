import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ValidationPipe,
} from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { Repository } from "typeorm";
import { UserRole } from "../src/common/enums/user-role.enum";
import { AuthenticatedUser } from "../src/common/interfaces/authenticated-user.interface";
import { Publicacion } from "../src/publicaciones/entities/publicacion.entity";
import { CreateComentarioDto } from "../src/comentarios/dto/create-comentario.dto";
import { UpdateComentarioDto } from "../src/comentarios/dto/update-comentario.dto";
import { Comentario } from "../src/comentarios/entities/comentario.entity";
import { ComentariosService } from "../src/comentarios/comentarios.service";

describe("ComentariosService", () => {
  let service: ComentariosService;
  let commentsRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
  };
  let publicationsRepository: { findOneBy: jest.Mock };

  const author: AuthenticatedUser = {
    id: 1,
    name: "Ada Lovelace",
    email: "ada@example.com",
    role: UserRole.USUARIO,
  };
  const otherUser: AuthenticatedUser = {
    id: 2,
    name: "Grace Hopper",
    email: "grace@example.com",
    role: UserRole.USUARIO,
  };
  const comment = {
    id: 10,
    content: "Comentario inicial",
    publication: { id: 20 },
    author: {
      id: author.id,
      name: author.name,
      email: author.email,
      passwordHash: "must-not-be-returned",
    },
  } as Comentario;

  beforeEach(() => {
    commentsRepository = {
      create: jest.fn((value) => value),
      save: jest.fn().mockImplementation(async (value) => value),
      find: jest.fn().mockResolvedValue([comment]),
      findOne: jest.fn().mockResolvedValue(comment),
      remove: jest.fn().mockResolvedValue(comment),
    };
    publicationsRepository = {
      findOneBy: jest.fn().mockResolvedValue({ id: 20 }),
    };
    service = new ComentariosService(
      commentsRepository as unknown as Repository<Comentario>,
      publicationsRepository as unknown as Repository<Publicacion>,
    );
  });

  it("creates a comment using the authenticated author and existing publication", async () => {
    commentsRepository.save.mockResolvedValueOnce({ ...comment, id: 10 });

    const result = await service.create(
      20,
      { content: "Nuevo comentario" } as CreateComentarioDto,
      author,
    );

    expect(publicationsRepository.findOneBy).toHaveBeenCalledWith({ id: 20 });
    expect(commentsRepository.create).toHaveBeenCalledWith({
      content: "Nuevo comentario",
      publication: { id: 20 },
      author: { id: author.id },
    });
    expect(commentsRepository.save).toHaveBeenCalled();
    expect(commentsRepository.findOne).toHaveBeenCalledWith({
      where: { id: 10 },
      relations: { author: true, publication: true },
    });
    expect(result.author).toEqual({ id: author.id, name: author.name });
    expect(JSON.stringify(result)).not.toContain("passwordHash");
    expect(JSON.stringify(result)).not.toContain(author.email);
  });

  it("does not create a comment for a missing publication", async () => {
    publicationsRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.create(
        404,
        { content: "Comentario" } as CreateComentarioDto,
        author,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(commentsRepository.save).not.toHaveBeenCalled();
  });

  it("returns not found when listing comments for a missing publication", async () => {
    publicationsRepository.findOneBy.mockResolvedValue(null);

    await expect(service.findByPublication(404)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(commentsRepository.find).not.toHaveBeenCalled();
  });

  it("lists comments for an existing publication in chronological order", async () => {
    await expect(service.findByPublication(20)).resolves.toEqual([
      {
        id: comment.id,
        content: comment.content,
        publicationId: comment.publication.id,
        author: { id: author.id, name: author.name },
        createdAt: undefined,
      },
    ]);
    expect(commentsRepository.find).toHaveBeenCalledWith({
      where: { publication: { id: 20 } },
      relations: { author: true, publication: true },
      order: { createdAt: "ASC", id: "ASC" },
    });
  });

  it("rejects edits by a user who is not the comment author", async () => {
    await expect(
      service.update(
        10,
        { content: "Editado" } as UpdateComentarioDto,
        otherUser,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(commentsRepository.save).not.toHaveBeenCalled();
  });

  it("updates a comment when requested by its author", async () => {
    const editableComment = {
      ...comment,
      author: { id: author.id, name: author.name },
    };
    commentsRepository.findOne.mockResolvedValue(editableComment);

    await service.update(
      10,
      { content: "Editado" } as UpdateComentarioDto,
      author,
    );

    expect(commentsRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 10, content: "Editado" }),
    );
  });

  it("returns not found when editing a missing comment", async () => {
    commentsRepository.findOne.mockResolvedValue(null);

    await expect(
      service.update(
        404,
        { content: "Editado" } as UpdateComentarioDto,
        author,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("allows a moderator to delete another user’s comment", async () => {
    const moderator = { ...otherUser, role: UserRole.MODERADOR };

    await expect(service.remove(10, moderator)).resolves.toBeUndefined();
    expect(commentsRepository.remove).toHaveBeenCalledWith(comment);
  });

  it("rejects deletion by another regular user", async () => {
    await expect(service.remove(10, otherUser)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(commentsRepository.remove).not.toHaveBeenCalled();
  });
});

describe("Comentario DTO validation", () => {
  it("trims and accepts non-empty comment content", async () => {
    const dto = plainToInstance(CreateComentarioDto, {
      content: "  Comentario válido  ",
    });

    expect(dto.content).toBe("Comentario válido");
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it("rejects blank content and content longer than 2000 characters", async () => {
    const blank = plainToInstance(UpdateComentarioDto, { content: "   " });
    const tooLong = plainToInstance(CreateComentarioDto, {
      content: "x".repeat(2001),
    });

    expect(await validate(blank)).not.toHaveLength(0);
    expect(await validate(tooLong)).not.toHaveLength(0);
  });

  it("rejects client-supplied author identifiers in request bodies", async () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });

    await expect(
      pipe.transform(
        { content: "Comentario", authorId: 999 },
        { type: "body", metatype: CreateComentarioDto },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
