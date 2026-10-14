import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Publicacion } from '../publicaciones/entities/publicacion.entity';
import { ReaccionesController } from './reacciones.controller';
import { ReaccionesService } from './reacciones.service';
import { Reaccion } from './entities/reaccion.entity';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Reaccion, Publicacion]),
  ],
  controllers: [ReaccionesController],
  providers: [ReaccionesService],
  exports: [ReaccionesService],
})
export class ReaccionesModule {}