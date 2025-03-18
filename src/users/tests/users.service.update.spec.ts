import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { Role, Prisma } from '@prisma/client';
import { User } from '../entities/user.entity';
import * as argon2 from 'argon2';
import { NotFoundException, ConflictException } from '@nestjs/common';

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
        email: updateUserDto.email ?? 'default@example.com',
        password: 'hashedpassword123',
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.user, 'update').mockResolvedValue(mockUpdatedUser);

      await expect(service.update(userId, updateUserDto)).resolves.toEqual(mockUpdatedUser);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateUserDto,
      });
    });

    it('should hash the password before saving if updated', async () => {
      const userId = '1';
      const updateUserDto: UpdateUserDto = { password: 'newSecurePassword' };

      const hashedPassword = 'argon2hashedpassword123';
      jest.spyOn(argon2, 'hash').mockResolvedValue(hashedPassword);

      const mockUpdatedUser: User = {
        id: userId,
        email: 'testuser@example.com',
        password: hashedPassword,
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.user, 'update').mockResolvedValue(mockUpdatedUser);

      const result = await service.update(userId, updateUserDto);

      expect(result.password).toBe(hashedPassword);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { password: hashedPassword },
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const userId = '999';
      const updateUserDto: UpdateUserDto = { email: 'nonexistent@example.com' };

      jest.spyOn(prisma.user, 'update').mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Record does not exist', {
          code: 'P2025',
          clientVersion: 'latest',
        })
      );

      await expect(service.update(userId, updateUserDto)).rejects.toThrow(NotFoundException);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateUserDto,
      });
    });

    it('should throw ConflictException if email is already taken', async () => {
      const userId = '1';
      const updateUserDto: UpdateUserDto = { email: 'taken@example.com' };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: '2',
        email: 'taken@example.com',
        password: 'hashedpassword123',
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.update(userId, updateUserDto)).rejects.toThrow(ConflictException);
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
