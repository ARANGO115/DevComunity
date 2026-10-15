import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { UserRole } from "../src/common/enums/user-role.enum";
import { AuthenticatedUser } from "../src/common/interfaces/authenticated-user.interface";
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
  let dataSource: { query: jest.Mock };

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
    publicationId: 20,
    author: { id: author.id },
  } as Comentario;

  beforeEach(() => {
    commentsRepository = {
      create: jest.fn((value) => value),
      save: jest.fn().mockImplementation(async (value) => value),
      find: jest.fn().mockResolvedValue([comment]),
      findOne: jest.fn().mockResolvedValue(comment),
      remove: jest.fn().mockResolvedValue(comment),
    };
    dataSource = {
      query: jest.fn().mockResolvedValue([{ id: 20 }]),
    };
    service = new ComentariosService(
      commentsRepository as unknown as Repository<Comentario>,
      dataSource as unknown as DataSource,
    );
  });

  it("creates a comment using the authenticated author and existing publication", async () => {
    commentsRepository.save.mockResolvedValueOnce({ ...comment, id: 10 });

    await service.create(
      20,
      { content: "Nuevo comentario" } as CreateComentarioDto,
      author,
    );

    expect(dataSource.query).toHaveBeenCalledWith(
      "SELECT `id` FROM `publications` WHERE `id` = ? LIMIT 1",
      [20],
    );
    expect(commentsRepository.create).toHaveBeenCalledWith({
      content: "Nuevo comentario",
      publicationId: 20,
      author: { id: author.id },
    });
    expect(commentsRepository.save).toHaveBeenCalled();
    expect(commentsRepository.findOne).toHaveBeenCalledWith({
      where: { id: 10 },
      relations: { author: true },
    });
  });

  it("does not create a comment for a missing publication", async () => {
    dataSource.query.mockResolvedValue([]);

    await expect(
      service.create(
        404,
        { content: "Comentario" } as CreateComentarioDto,
        author,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(commentsRepository.save).not.toHaveBeenCalled();
  });

  it("lists comments for an existing publication in chronological order", async () => {
    await expect(service.findByPublication(20)).resolves.toEqual([comment]);
    expect(commentsRepository.find).toHaveBeenCalledWith({
      where: { publicationId: 20 },
      relations: { author: true },
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
    const editableComment = { ...comment, author: { id: author.id } };
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
