import { UserRole } from '../enums/user-role.enum';

export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}
