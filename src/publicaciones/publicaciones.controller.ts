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
	ApiBadRequestResponse,
	ApiCreatedResponse,
	ApiForbiddenResponse,
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
	@ApiBadRequestResponse({
		description: 'El cuerpo de la solicitud no es válido.',
	})
	@ApiUnauthorizedResponse({ description: 'Se requiere autenticación.' })
	create(
		@Body() dto: CreatePublicacionDto,
		@Req() request: AuthenticatedRequest,
	): Promise<Publicacion> {
		return this.publicacionesService.create(dto, request.user);
	}

	@Get()
	@ApiOperation({ summary: 'Listar publicaciones' })
	@ApiOkResponse({
		description: 'Publicaciones ordenadas de más reciente a más antigua',
		type: [Publicacion],
	})
	findAll(): Promise<Publicacion[]> {
		return this.publicacionesService.findAll();
	}

	@Get(':id')
	@ApiOperation({ summary: 'Consultar una publicación' })
	@ApiParam({ name: 'id', type: Number, example: 1 })
	@ApiOkResponse({ description: 'Publicación encontrada', type: Publicacion })
	@ApiBadRequestResponse({
		description: 'El identificador debe ser un entero.',
	})
	@ApiNotFoundResponse({ description: 'Publicación inexistente' })
	findOne(@Param('id', ParseIntPipe) id: number): Promise<Publicacion> {
		return this.publicacionesService.findOne(id);
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Editar una publicación propia o como ADMIN' })
	@ApiParam({ name: 'id', type: Number, example: 1 })
	@ApiOkResponse({ description: 'Publicación actualizada', type: Publicacion })
	@ApiBadRequestResponse({
		description: 'El identificador o el cuerpo no son válidos.',
	})
	@ApiNotFoundResponse({ description: 'Publicación inexistente' })
	@ApiUnauthorizedResponse({ description: 'Se requiere autenticación.' })
	@ApiForbiddenResponse({
		description: 'Solo el autor o ADMIN puede editarla.',
	})
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
	@ApiOperation({
		summary: 'Eliminar una publicación propia o como MODERADOR/ADMIN',
	})
	@ApiParam({ name: 'id', type: Number, example: 1 })
	@ApiNoContentResponse({ description: 'Publicación eliminada' })
	@ApiBadRequestResponse({
		description: 'El identificador debe ser un entero.',
	})
	@ApiNotFoundResponse({ description: 'Publicación inexistente' })
	@ApiUnauthorizedResponse({ description: 'Se requiere autenticación.' })
	@ApiForbiddenResponse({
		description: 'Solo el autor, MODERADOR o ADMIN puede eliminarla.',
	})
	remove(
		@Param('id', ParseIntPipe) id: number,
		@Req() request: AuthenticatedRequest,
	): Promise<void> {
		return this.publicacionesService.remove(id, request.user);
	}
}
