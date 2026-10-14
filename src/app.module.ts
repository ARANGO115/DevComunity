import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { PublicacionesModule } from './publicaciones/publicaciones.module';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().port().default(3000),
        DB_TYPE: Joi.string().valid('mysql').default('mysql'),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().port().default(3306),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().allow('').required(),
        DB_NAME: Joi.string().required(),
        DB_SYNCHRONIZE: Joi.boolean().default(false),
        DB_LOGGING: Joi.boolean().default(false),
        JWT_SECRET: Joi.string()
          .min(32)
          .invalid('REEMPLAZAR_POR_UN_SECRETO_ALEATORIO')
          .required(),
        JWT_EXPIRES_IN: Joi.string().default('1d'),
      }),
    }),
    DatabaseModule,
    PublicacionesModule,
    UsersModule,
    RolesModule,
    AuthModule,
  ],
})
export class AppModule {}