import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';
import { User } from '../entities/user.entity';

describe('UsersService - Delete User', () => {
  let service: UsersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              delete: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('remove', () => {
    it('should remove a user by ID', async () => {
      const userId = '1';
  
      jest.spyOn(prisma.user, 'delete').mockResolvedValue({
        id: '1',
        email: 'deleteduser@example.com',
        password: 'deletedpassword',
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User);
  
      await expect(service.remove(userId)).resolves.toMatchObject({
        id: '1',
        email: 'deleteduser@example.com',
      });
  
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  
    it('should throw an error if user does not exist', async () => {
      const userId = '999';
  
      jest.spyOn(prisma.user, 'delete').mockRejectedValue(new Error('Record to delete does not exist.'));
  
      await expect(service.remove(userId)).rejects.toThrow('Record to delete does not exist.');
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  
    it('should throw an error if provided with an invalid user ID format', async () => {
      const invalidId = 'invalid_id';
  
      await expect(service.remove(invalidId)).rejects.toThrow('Invalid user ID');
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });
  
    it('should throw an error if Prisma encounters a database issue', async () => {
      const userId = '3';
  
      jest.spyOn(prisma.user, 'delete').mockRejectedValue(new Error('Database delete error'));
  
      await expect(service.remove(userId)).rejects.toThrow('Database delete error');
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  });  
  
});
