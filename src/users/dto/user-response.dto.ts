import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/user-role.enum';

export class UserResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Ada Lovelace' })
  name: string;

  @ApiProperty({ example: 'ada@example.com' })
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.USUARIO })
  role: UserRole;

  @ApiProperty({ example: '2026-10-14T12:00:00.000Z' })
  createdAt: Date;
}
