import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { QueryFailedError, Repository } from 'typeorm';
import { UserRole } from '../common/enums/user-role.enum';
import { Reaccion } from '../reacciones/entities/reaccion.entity';
import { Role } from '../roles/entities/role.entity';
import { RolesService } from '../roles/roles.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

const PASSWORD_HASH_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly rolesService: RolesService,
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

  async createManaged(dto: CreateUserDto): Promise<UserResponseDto> {
    const role = await this.getRole(dto.role ?? UserRole.USUARIO);
    const passwordHash = await this.hashPassword(dto.password);

    try {
      return this.toResponse(
        await this.create(
          {
            name: dto.name.trim(),
            email: dto.email.trim().toLowerCase(),
            passwordHash,
          },
          role.id,
        ),
      );
    } catch (error: unknown) {
      if (this.isDuplicateEntry(error)) {
        throw new ConflictException(
          'El correo electrónico ya está registrado.',
        );
      }
      throw error;
    }
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.find({ order: { id: 'ASC' } });
    return users.map((user) => this.toResponse(user));
  }

  async findOne(id: number): Promise<UserResponseDto> {
    return this.toResponse(await this.findEntityOrThrow(id));
  }

  async updateManaged(
    id: number,
    dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException(
        'Debe proporcionar al menos un campo para actualizar.',
      );
    }

    const user = await this.findEntityOrThrow(id);
    if (dto.name !== undefined) {
      user.name = dto.name.trim();
    }
    if (dto.email !== undefined) {
      user.email = dto.email.trim().toLowerCase();
    }
    if (dto.password !== undefined) {
      user.passwordHash = await this.hashPassword(dto.password);
    }
    if (dto.role !== undefined) {
      user.role = await this.getRole(dto.role);
    }

    try {
      const savedUser = await this.usersRepository.save(user);
      return this.toResponse(await this.findEntityOrThrow(savedUser.id));
    } catch (error: unknown) {
      if (this.isDuplicateEntry(error)) {
        throw new ConflictException(
          'El correo electrónico ya está registrado.',
        );
      }
      throw error;
    }
  }

  async removeManaged(id: number, requestingUserId: number): Promise<void> {
    if (id === requestingUserId) {
      throw new ForbiddenException(
        'No puedes eliminar tu propia cuenta de administrador.',
      );
    }

    try {
      await this.usersRepository.manager.transaction(async (manager) => {
        const usersRepository = manager.getRepository(User);
        const user = await usersRepository.findOne({
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!user) {
          throw new NotFoundException('El usuario no existe.');
        }

        const reactionsCount = await manager
          .getRepository(Reaccion)
          .count({ where: { user: { id } } });
        if (reactionsCount > 0) {
          throw new ConflictException(
            'No se puede eliminar el usuario porque tiene reacciones asociadas.',
          );
        }

        await usersRepository.remove(user);
      });
    } catch (error: unknown) {
      if (this.isForeignKeyViolation(error)) {
        throw new ConflictException(
          'No se puede eliminar el usuario porque tiene publicaciones, comentarios o reacciones asociadas.',
        );
      }
      throw error;
    }
  }

  private async findEntityOrThrow(id: number): Promise<User> {
    const user = await this.findByIdForAuth(id);
    if (!user) {
      throw new NotFoundException('El usuario no existe.');
    }
    return user;
  }

  private async getRole(roleName: UserRole): Promise<Role> {
    const role = await this.rolesService.findByName(roleName);
    if (!role) {
      throw new InternalServerErrorException(
        'El rol solicitado no está configurado.',
      );
    }
    return role;
  }

  private async hashPassword(password: string): Promise<string> {
    if (Buffer.byteLength(password, 'utf8') > 72) {
      throw new BadRequestException(
        'La contraseña no puede superar los 72 bytes UTF-8.',
      );
    }
    return bcrypt.hash(password, PASSWORD_HASH_ROUNDS);
  }

  private toResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      createdAt: user.createdAt,
    };
  }

  private isDuplicateEntry(error: unknown): boolean {
    return (
      error instanceof QueryFailedError &&
      typeof error.driverError === 'object' &&
      error.driverError !== null &&
      'code' in error.driverError &&
      error.driverError.code === 'ER_DUP_ENTRY'
    );
  }

  private isForeignKeyViolation(error: unknown): boolean {
    if (
      !(error instanceof QueryFailedError) ||
      typeof error.driverError !== 'object' ||
      error.driverError === null
    ) {
      return false;
    }
    const driverError = error.driverError as { code?: string; errno?: number };
    return (
      driverError.code === 'ER_ROW_IS_REFERENCED_2' ||
      driverError.code === 'ER_ROW_IS_REFERENCED' ||
      driverError.errno === 1451
    );
  }
}
