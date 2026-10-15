import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { Request } from "express";
import { AuthenticatedUser } from "../common/interfaces/authenticated-user.interface";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateComentarioDto } from "./dto/create-comentario.dto";
import { UpdateComentarioDto } from "./dto/update-comentario.dto";
import { Comentario } from "./entities/comentario.entity";
import { ComentariosService } from "./comentarios.service";

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@ApiTags("comments")
@Controller()
export class ComentariosController {
  constructor(private readonly comentariosService: ComentariosService) {}

  @Post("publications/:publicationId/comments")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a comment on a publication" })
  @ApiParam({ name: "publicationId", type: Number })
  @ApiCreatedResponse({ type: Comentario })
  @ApiNotFoundResponse({ description: "The publication does not exist." })
  create(
    @Param("publicationId", ParseIntPipe) publicationId: number,
    @Body() dto: CreateComentarioDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<Comentario> {
    return this.comentariosService.create(publicationId, dto, request.user);
  }

  @Get("publications/:publicationId/comments")
  @ApiOperation({ summary: "List comments for a publication" })
  @ApiParam({ name: "publicationId", type: Number })
  @ApiOkResponse({ type: Comentario, isArray: true })
  @ApiNotFoundResponse({ description: "The publication does not exist." })
  findByPublication(
    @Param("publicationId", ParseIntPipe) publicationId: number,
  ): Promise<Comentario[]> {
    return this.comentariosService.findByPublication(publicationId);
  }

  @Patch("comments/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Edit a comment owned by the current user" })
  @ApiParam({ name: "id", type: Number })
  @ApiOkResponse({ type: Comentario })
  @ApiNotFoundResponse({ description: "The comment does not exist." })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateComentarioDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<Comentario> {
    return this.comentariosService.update(id, dto, request.user);
  }

  @Delete("comments/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Delete a comment owned by the current user or a moderator",
  })
  @ApiParam({ name: "id", type: Number })
  @ApiNotFoundResponse({ description: "The comment does not exist." })
  remove(
    @Param("id", ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    return this.comentariosService.remove(id, request.user);
  }
}
