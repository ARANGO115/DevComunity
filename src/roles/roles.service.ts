import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserRole } from '../common/enums/user-role.enum';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.rolesRepository.upsert(
      Object.values(UserRole).map((name) => ({ name })),
      ['name'],
    );
  }

  findByName(name: UserRole): Promise<Role | null> {
    return this.rolesRepository.findOneBy({ name });
  }

  findAll(): Promise<Role[]> {
    return this.rolesRepository.findBy({ name: In(Object.values(UserRole)) });
  }
}