import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
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
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Ada Lovelace' },
        email: { type: 'string', example: 'ada@example.com' },
        role: { type: 'string', example: 'USUARIO' },
      },
      required: ['id', 'name', 'email', 'role'],
      example: {
        id: 1,
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        role: 'USUARIO',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Los datos enviados no son válidos.' })
  @ApiConflictResponse({
    description: 'El correo electrónico ya está registrado.',
  })
  register(@Body() dto: RegisterDto): Promise<PublicUser> {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiOkResponse({
    description: 'Token JWT y usuario autenticado',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string', example: '******' },
        token_type: { type: 'string', example: 'Bearer' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'Ada Lovelace' },
            email: { type: 'string', example: 'ada@example.com' },
            role: { type: 'string', example: 'USUARIO' },
          },
          required: ['id', 'name', 'email', 'role'],
        },
      },
      required: ['access_token', 'token_type', 'user'],
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
  @ApiBadRequestResponse({ description: 'Los datos enviados no son válidos.' })
  @ApiUnauthorizedResponse({ description: 'Las credenciales son inválidas.' })
  login(@Body() dto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(dto);
  }
}
