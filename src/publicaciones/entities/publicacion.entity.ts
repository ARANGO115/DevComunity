
import { ApiProperty } from '@nestjs/swagger';
import {
  CreateDateColumn,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Comentario } from '../../comentarios/entities/comentario.entity';
import { Reaccion } from '../../reacciones/entities/reaccion.entity';
import { User } from '../../users/entities/user.entity';

@Entity('publicaciones')
export class Publicacion {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Ideas para la comunidad' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({ example: 'Contenido de la publicación.' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ example: '2026-10-14T12:00:00.000Z' })
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({
    type: 'object',
    properties: {
      id: { type: 'number' },
      name: { type: 'string' },
    },
  })
  @ManyToOne(() => User, (user) => user.publications, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @OneToMany(() => Reaccion, (reaccion) => reaccion.publication)
  reactions: Reaccion[];

  @OneToMany(() => Comentario, (comentario) => comentario.publication)
  comments: Comentario[];
}
