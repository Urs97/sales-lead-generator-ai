import { Role } from '@prisma/client';

export class User {
    id: string;
    email: string;
    password: string;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
  }