import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findByEmailForAuth(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.email = :email', { email })
      .getOne();
  }

  findByIdForAuth(id: number): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: { role: true },
    });
  }

  async create(
    data: Pick<User, 'name' | 'email' | 'passwordHash'>,
    roleId: number,
  ): Promise<User> {
    const user = this.usersRepository.create({
      ...data,
      role: { id: roleId },
    });
    const savedUser = await this.usersRepository.save(user);
    const createdUser = await this.findByIdForAuth(savedUser.id);
    if (!createdUser) {
      throw new Error('User could not be reloaded after creation.');
    }
    return createdUser;
  }
}