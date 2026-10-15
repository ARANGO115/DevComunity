import {
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Publicacion } from '../../publicaciones/entities/publicacion.entity';
import { User } from '../../users/entities/user.entity';

@Entity('reacciones')
@Index('UQ_reacciones_user_publication', ['user', 'publication'], {
  unique: true,
})
export class Reaccion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.reactions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Publicacion, (publication) => publication.reactions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'publicationId' })
  publication: Publicacion;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}