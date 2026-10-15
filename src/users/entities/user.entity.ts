import {
  CreateDateColumn,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from '../../roles/entities/role.entity';
import { Reaccion } from '../../reacciones/entities/reaccion.entity';
import { Publicacion } from '../../publicaciones/entities/publicacion.entity';
import { Comentario } from '../../comentarios/entities/comentario.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, select: false })
  passwordHash: string;

  @ManyToOne(() => Role, (role) => role.users, {
    nullable: false,
    eager: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @OneToMany(() => Reaccion, (reaccion) => reaccion.user)
  reactions: Reaccion[];

  @OneToMany(() => Publicacion, (publication) => publication.author)
  publications: Publicacion[];

  @OneToMany(() => Comentario, (comment) => comment.author)
  comments: Comentario[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}