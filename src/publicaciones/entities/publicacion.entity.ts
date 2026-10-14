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
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.publications, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @OneToMany(() => Reaccion, (reaccion) => reaccion.publication)
  reactions: Reaccion[];

  @OneToMany(() => Comentario, (comment) => comment.publication)
  comments: Comentario[];
}