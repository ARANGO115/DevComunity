import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../common/enums/user-role.enum';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { User } from '../users/entities/user.entity';
import { CreatePublicacionDto } from './dto/create-publicacion.dto';
import { UpdatePublicacionDto } from './dto/update-publicacion.dto';
import { Publicacion } from './entities/publicacion.entity';

@Injectable()
export class PublicacionesService {
	constructor(
		@InjectRepository(Publicacion)
		private readonly publicacionesRepository: Repository<Publicacion>,
	) {}

	async create(dto: CreatePublicacionDto, author: AuthenticatedUser): Promise<Publicacion> {
		const publicacion = this.publicacionesRepository.create({
			title: dto.title,
			content: dto.content,
			author: { id: author.id } as User,
		});
		const saved = await this.publicacionesRepository.save(publicacion);
		return this.findOne(saved.id);
	}

	findAll(): Promise<Publicacion[]> {
		return this.publicacionesRepository.find({
			select: {
				id: true,
				title: true,
				content: true,
				createdAt: true,
				author: { id: true, name: true },
			},
			relations: { author: true },
			order: { createdAt: 'DESC', id: 'DESC' },
		});
	}

	async findOne(id: number): Promise<Publicacion> {
		const publicacion = await this.publicacionesRepository.findOne({
			where: { id },
			select: {
				id: true,
				title: true,
				content: true,
				createdAt: true,
				author: { id: true, name: true },
			},
			relations: { author: true },
		});
		if (!publicacion) {
			throw new NotFoundException('Publicación no encontrada.');
		}
		return publicacion;
	}

	async update(
		id: number,
		dto: UpdatePublicacionDto,
		user: AuthenticatedUser,
	): Promise<Publicacion> {
		if (Object.keys(dto).length === 0) {
			throw new BadRequestException('Debe proporcionar al menos un campo para actualizar.');
		}

		const publicacion = await this.findOne(id);
		if (publicacion.author.id !== user.id && user.role !== UserRole.ADMIN) {
			throw new ForbiddenException('No tienes permiso para editar esta publicación.');
		}

		Object.assign(publicacion, dto);
		return this.publicacionesRepository.save(publicacion);
	}

	async remove(id: number, user: AuthenticatedUser): Promise<void> {
		const publicacion = await this.findOne(id);
		const canDelete =
			publicacion.author.id === user.id ||
			user.role === UserRole.MODERADOR ||
			user.role === UserRole.ADMIN;
		if (!canDelete) {
			throw new ForbiddenException('No tienes permiso para eliminar esta publicación.');
		}

		await this.publicacionesRepository.remove(publicacion);
	}
}
