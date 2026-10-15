import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreatePublicacionDto {
	@ApiProperty({
		example: 'Ideas para la comunidad',
		description: 'Título de la publicación.',
		minLength: 1,
		maxLength: 255,
	})
	@Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
	@IsString()
	@IsNotEmpty()
	@MaxLength(255)
	title: string;

	@ApiProperty({
		example: 'Contenido de la publicación.',
		description: 'Contenido de la publicación.',
		minLength: 1,
		maxLength: 16000,
	})
	@Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
	@IsString()
	@IsNotEmpty()
	@MaxLength(16000)
	content: string;
}
