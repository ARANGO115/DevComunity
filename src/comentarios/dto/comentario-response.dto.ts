import { ApiProperty } from "@nestjs/swagger";

class ComentarioAuthorDto {
  @ApiProperty({ example: 12 })
  id: number;

  @ApiProperty({ example: "Ada Lovelace" })
  name: string;
}

export class ComentarioResponseDto {
  @ApiProperty({ example: 34 })
  id: number;

  @ApiProperty({ example: "¡Gracias por compartir esta solución!" })
  content: string;

  @ApiProperty({ example: 8 })
  publicationId: number;

  @ApiProperty({ type: ComentarioAuthorDto })
  author: ComentarioAuthorDto;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}
