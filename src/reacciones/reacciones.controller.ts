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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  @ApiResponse({ status: 201, description: 'Like registrado.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 404, description: 'Publicación inexistente.' })
  @ApiResponse({ status: 409, description: 'Like duplicado.' })
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
  @ApiResponse({ status: 204, description: 'Like retirado.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 404, description: 'Like inexistente.' })
  async remove(
    @Param('publicationId', ParseIntPipe) publicationId: number,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.reaccionesService.remove(publicationId, request.user.id);
  }

  @Get('count')
  @ApiOperation({ summary: 'Consultar el total de likes de una publicación' })
  @ApiResponse({ status: 200, description: 'Total de likes.' })
  @ApiResponse({ status: 404, description: 'Publicación inexistente.' })
  count(@Param('publicationId', ParseIntPipe) publicationId: number) {
    return this.reaccionesService.count(publicationId);
  }
}