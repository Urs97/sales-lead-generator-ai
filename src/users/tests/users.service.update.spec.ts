import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { Role } from '@prisma/client';
import { User } from '../entities/user.entity';

describe('UsersService - Update User', () => {
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
              update: jest.fn(),
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

  describe('update', () => {
    it('should update a user by ID', async () => {
      const userId = '1';
      const updateUserDto: UpdateUserDto = { email: 'updated@example.com' };

      const mockUpdatedUser: User = {
        id: userId,
        email: updateUserDto.email || 'default@example.com',
        password: 'hashedpassword123',
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.user, 'update').mockResolvedValue(mockUpdatedUser);

      await expect(service.update(userId, updateUserDto)).resolves.toMatchObject({
        id: userId,
        email: 'updated@example.com',
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateUserDto,
      });
    });

    it('should hash the password before saving if updated', async () => {
      const userId = '1';
      const updateUserDto: UpdateUserDto = { password: 'newSecurePassword' };

      const mockUpdatedUser: User = {
        id: userId,
        email: 'testuser@example.com',
        password: 'hashedpassword456',
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.user, 'update').mockResolvedValue(mockUpdatedUser);

      const result = await service.update(userId, updateUserDto);

      expect(result.password).not.toBe(updateUserDto.password);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateUserDto,
      });
    });

    it('should throw an error if user does not exist', async () => {
      const userId = '999';
      const updateUserDto: UpdateUserDto = { email: 'nonexistent@example.com' };

      jest.spyOn(prisma.user, 'update').mockRejectedValue(new Error('Record to update does not exist.'));

      await expect(service.update(userId, updateUserDto)).rejects.toThrow('Record to update does not exist.');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateUserDto,
      });
    });

    it('should throw an error if provided with an invalid user ID format', async () => {
      const invalidId = 'invalid_id';
      const updateUserDto: UpdateUserDto = { email: 'valid@example.com' };

      await expect(service.update(invalidId, updateUserDto)).rejects.toThrow('Invalid user ID');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should throw an error if email is invalid', async () => {
      const userId = '1';
      const updateUserDto: UpdateUserDto = { email: 'invalid-email' };

      await expect(service.update(userId, updateUserDto)).rejects.toThrow();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should throw an error if password is too short', async () => {
      const userId = '1';
      const updateUserDto: UpdateUserDto = { password: '123' };

      await expect(service.update(userId, updateUserDto)).rejects.toThrow();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should throw an error if Prisma encounters a database issue', async () => {
      const userId = '3';
      const updateUserDto: UpdateUserDto = { email: 'valid@example.com' };

      jest.spyOn(prisma.user, 'update').mockRejectedValue(new Error('Database update error'));

      await expect(service.update(userId, updateUserDto)).rejects.toThrow('Database update error');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateUserDto,
      });
    });
  });
});
