import { UserRole } from '../../common/enums/user-role.enum';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: UserRole, unique: true })
  name: UserRole;

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}