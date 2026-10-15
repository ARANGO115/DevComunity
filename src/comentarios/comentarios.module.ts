import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { Publicacion } from "../publicaciones/entities/publicacion.entity";
import { Comentario } from "./entities/comentario.entity";
import { ComentariosController } from "./comentarios.controller";
import { ComentariosService } from "./comentarios.service";

@Module({
  imports: [TypeOrmModule.forFeature([Comentario, Publicacion]), AuthModule],
  controllers: [ComentariosController],
  providers: [ComentariosService],
  exports: [ComentariosService],
})
export class ComentariosModule {}
