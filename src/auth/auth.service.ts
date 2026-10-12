import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { QueryFailedError } from 'typeorm';
import { UserRole } from '../common/enums/user-role.enum';
import { RolesService } from '../roles/roles.service';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export interface PublicUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  access_token: string;
  token_type: 'Bearer';
  user: PublicUser;
}

const PASSWORD_HASH_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<PublicUser> {
    if (Buffer.byteLength(dto.password, 'utf8') > 72) {
      throw new BadRequestException(
        'La contraseña no puede superar los 72 bytes UTF-8.',
      );
    }

    const email = dto.email.trim().toLowerCase();
    if (await this.usersService.findByEmailForAuth(email)) {
      throw new ConflictException('El correo electrónico ya está registrado.');
    }

    const role = await this.rolesService.findByName(UserRole.USUARIO);
    if (!role) {
      throw new InternalServerErrorException(
        'El rol predeterminado no está configurado.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_HASH_ROUNDS);
    try {
      const user = await this.usersService.create(
        { name: dto.name.trim(), email, passwordHash },
        role.id,
      );
      return this.toPublicUser(user);
    } catch (error: unknown) {
      if (this.isDuplicateEntry(error)) {
        throw new ConflictException(
          'El correo electrónico ya está registrado.',
        );
      }
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.usersService.findByEmailForAuth(
      dto.email.trim().toLowerCase(),
    );

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const publicUser = this.toPublicUser(user);
    const accessToken = await this.jwtService.signAsync(
      { email: publicUser.email, role: publicUser.role },
      { subject: String(publicUser.id) },
    );

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      user: publicUser,
    };
  }

  private toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
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
}