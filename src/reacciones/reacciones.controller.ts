import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { ReaccionesService } from './reacciones.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@ApiTags('Likes')
@Controller('publications/:publicationId/likes')
export class ReaccionesController {
  constructor(private readonly reaccionesService: ReaccionesService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Agregar un like a una publicación' })
  @ApiParam({ name: 'publicationId', type: Number, example: 1 })
  @ApiCreatedResponse({
    description: 'Like registrado.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        user: {
          type: 'object',
          properties: { id: { type: 'number', example: 5 } },
          required: ['id'],
        },
        publication: {
          type: 'object',
          properties: { id: { type: 'number', example: 1 } },
          required: ['id'],
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2026-10-14T12:00:00.000Z',
        },
      },
      required: ['id', 'user', 'publication', 'createdAt'],
      example: {
        id: 1,
        user: { id: 5 },
        publication: { id: 1 },
        createdAt: '2026-10-14T12:00:00.000Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'El identificador debe ser un entero.',
  })
  @ApiUnauthorizedResponse({ description: 'No autenticado.' })
  @ApiNotFoundResponse({ description: 'Publicación inexistente.' })
  @ApiConflictResponse({
    description: 'El usuario ya indicó que le gusta esta publicación.',
  })
  create(
    @Param('publicationId', ParseIntPipe) publicationId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.reaccionesService.create(publicationId, request.user.id);
  }

  @Delete()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  @ApiOperation({ summary: 'Retirar el like propio de una publicación' })
  @ApiParam({ name: 'publicationId', type: Number, example: 1 })
  @ApiNoContentResponse({ description: 'Like retirado.' })
  @ApiBadRequestResponse({
    description: 'El identificador debe ser un entero.',
  })
  @ApiUnauthorizedResponse({ description: 'No autenticado.' })
  @ApiNotFoundResponse({
    description: 'Like inexistente para el usuario autenticado.',
  })
  async remove(
    @Param('publicationId', ParseIntPipe) publicationId: number,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.reaccionesService.remove(publicationId, request.user.id);
  }

  @Get('count')
  @ApiOperation({ summary: 'Consultar el total de likes de una publicación' })
  @ApiParam({ name: 'publicationId', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'Total de likes de la publicación.',
    schema: {
      type: 'object',
      properties: {
        publicationId: { type: 'number', example: 1 },
        count: { type: 'number', example: 3 },
      },
      required: ['publicationId', 'count'],
      example: { publicationId: 1, count: 3 },
    },
  })
  @ApiBadRequestResponse({
    description: 'El identificador debe ser un entero.',
  })
  @ApiNotFoundResponse({ description: 'Publicación inexistente.' })
  count(@Param('publicationId', ParseIntPipe) publicationId: number) {
    return this.reaccionesService.count(publicationId);
  }
}
