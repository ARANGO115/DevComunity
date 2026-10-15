import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Publicacion } from './entities/publicacion.entity';
import { PublicacionesController } from './publicaciones.controller';
import { PublicacionesService } from './publicaciones.service';

@Module({
	imports: [TypeOrmModule.forFeature([Publicacion]), AuthModule],
	controllers: [PublicacionesController],
	providers: [PublicacionesService],
	exports: [PublicacionesService],
})
export class PublicacionesModule {}
