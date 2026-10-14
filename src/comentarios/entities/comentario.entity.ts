import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Publicacion } from '../../publicaciones/entities/publicacion.entity';
import { User } from '../../users/entities/user.entity';

@Entity('comentarios')
export class Comentario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.comments, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @ManyToOne(() => Publicacion, (publication) => publication.comments, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'publicationId' })
  publication: Publicacion;
}