import { User, Role } from '@prisma/client';

export const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  password: 'password123',
  role: Role.USER,
  createdAt: new Date(),
  updatedAt: new Date(),
};
