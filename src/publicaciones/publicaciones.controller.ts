import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	Req,
	UseGuards,
} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiCreatedResponse,
	ApiNoContentResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreatePublicacionDto } from './dto/create-publicacion.dto';
import { UpdatePublicacionDto } from './dto/update-publicacion.dto';
import { Publicacion } from './entities/publicacion.entity';
import { PublicacionesService } from './publicaciones.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@ApiTags('publications')
@Controller('publications')
export class PublicacionesController {
	constructor(private readonly publicacionesService: PublicacionesService) {}

	@Post()
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Crear una publicación' })
	@ApiCreatedResponse({ description: 'Publicación creada', type: Publicacion })
	create(
		@Body() dto: CreatePublicacionDto,
		@Req() request: AuthenticatedRequest,
	): Promise<Publicacion> {
		return this.publicacionesService.create(dto, request.user);
	}

	@Get()
	@ApiOperation({ summary: 'Listar publicaciones' })
	@ApiOkResponse({ description: 'Publicaciones ordenadas de más reciente a más antigua', type: [Publicacion] })
	findAll(): Promise<Publicacion[]> {
		return this.publicacionesService.findAll();
	}

	@Get(':id')
	@ApiOperation({ summary: 'Consultar una publicación' })
	@ApiOkResponse({ description: 'Publicación encontrada', type: Publicacion })
	@ApiNotFoundResponse({ description: 'Publicación inexistente' })
	findOne(@Param('id', ParseIntPipe) id: number): Promise<Publicacion> {
		return this.publicacionesService.findOne(id);
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Editar una publicación propia o como ADMIN' })
	@ApiOkResponse({ description: 'Publicación actualizada', type: Publicacion })
	@ApiNotFoundResponse({ description: 'Publicación inexistente' })
	update(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: UpdatePublicacionDto,
		@Req() request: AuthenticatedRequest,
	): Promise<Publicacion> {
		return this.publicacionesService.update(id, dto, request.user);
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Eliminar una publicación propia o como MODERADOR/ADMIN' })
	@ApiNoContentResponse({ description: 'Publicación eliminada' })
	@ApiNotFoundResponse({ description: 'Publicación inexistente' })
	remove(
		@Param('id', ParseIntPipe) id: number,
		@Req() request: AuthenticatedRequest,
	): Promise<void> {
		return this.publicacionesService.remove(id, request.user);
	}
}
