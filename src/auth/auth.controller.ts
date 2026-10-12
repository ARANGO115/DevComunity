import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService, LoginResponse, PublicUser } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar una cuenta de usuario' })
  @ApiCreatedResponse({
    description: 'Usuario registrado sin credenciales ni hash',
    schema: {
      example: {
        id: 1,
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        role: 'USUARIO',
      },
    },
  })
  register(@Body() dto: RegisterDto): Promise<PublicUser> {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiOkResponse({
    description: 'Token JWT y usuario autenticado',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        token_type: 'Bearer',
        user: {
          id: 1,
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          role: 'USUARIO',
        },
      },
    },
  })
  login(@Body() dto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(dto);
  }
}