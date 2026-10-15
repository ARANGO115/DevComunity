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
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { Request } from "express";
import { AuthenticatedUser } from "../common/interfaces/authenticated-user.interface";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ComentarioResponseDto } from "./dto/comentario-response.dto";
import { CreateComentarioDto } from "./dto/create-comentario.dto";
import { UpdateComentarioDto } from "./dto/update-comentario.dto";
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
  @ApiCreatedResponse({ type: ComentarioResponseDto })
  @ApiBadRequestResponse({
    description: "The publication ID or request body is invalid.",
  })
  @ApiNotFoundResponse({ description: "The publication does not exist." })
  @ApiUnauthorizedResponse({ description: "Authentication is required." })
  create(
    @Param("publicationId", ParseIntPipe) publicationId: number,
    @Body() dto: CreateComentarioDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ComentarioResponseDto> {
    return this.comentariosService.create(publicationId, dto, request.user);
  }

  @Get("publications/:publicationId/comments")
  @ApiOperation({ summary: "List comments for a publication" })
  @ApiParam({ name: "publicationId", type: Number })
  @ApiOkResponse({ type: ComentarioResponseDto, isArray: true })
  @ApiBadRequestResponse({
    description: "The publication ID must be an integer.",
  })
  @ApiNotFoundResponse({ description: "The publication does not exist." })
  findByPublication(
    @Param("publicationId", ParseIntPipe) publicationId: number,
  ): Promise<ComentarioResponseDto[]> {
    return this.comentariosService.findByPublication(publicationId);
  }

  @Patch("comments/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Edit a comment owned by the current user" })
  @ApiParam({ name: "id", type: Number })
  @ApiOkResponse({ type: ComentarioResponseDto })
  @ApiBadRequestResponse({
    description: "The comment ID or request body is invalid.",
  })
  @ApiNotFoundResponse({ description: "The comment does not exist." })
  @ApiForbiddenResponse({ description: "Only the comment author can edit it." })
  @ApiUnauthorizedResponse({ description: "Authentication is required." })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateComentarioDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ComentarioResponseDto> {
    return this.comentariosService.update(id, dto, request.user);
  }

  @Delete("comments/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Delete a comment owned by the current user or a moderator",
  })
  @ApiParam({ name: "id", type: Number })
  @ApiOkResponse({ description: "Comment deleted." })
  @ApiBadRequestResponse({ description: "The comment ID must be an integer." })
  @ApiNotFoundResponse({ description: "The comment does not exist." })
  @ApiForbiddenResponse({
    description: "Only the author or a moderator can delete the comment.",
  })
  @ApiUnauthorizedResponse({ description: "Authentication is required." })
  remove(
    @Param("id", ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    return this.comentariosService.remove(id, request.user);
  }
}
