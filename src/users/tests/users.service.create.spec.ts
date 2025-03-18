import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { Role, Prisma } from '@prisma/client';
import { ConflictException } from '@nestjs/common';
import * as argon2 from 'argon2';

describe('UsersService - Create User', () => {
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
              create: jest.fn(),
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

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'newuser@example.com',
        password: 'newpassword123',
      };

      jest.spyOn(prisma.user, 'create').mockResolvedValue({
        id: '2',
        email: createUserDto.email,
        password: 'hashedpassword123',
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create(createUserDto);

      expect(result).toMatchObject({
        email: 'newuser@example.com',
        password: expect.any(String),
      });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: createUserDto.email,
          password: expect.any(String),
        }),
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      jest.spyOn(prisma.user, 'create').mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'latest',
        })
      );

      await expect(
        service.create({ email: 'existinguser@example.com', password: 'validPass123' })
      ).rejects.toThrow(ConflictException);

      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should hash the password before saving', async () => {
      const createUserDto: CreateUserDto = {
        email: 'secure@example.com',
        password: 'securepassword',
      };

      const hashedPassword = 'argon2hashedpassword123';
      const hashSpy = jest.spyOn(argon2, 'hash').mockResolvedValue(hashedPassword);

      jest.spyOn(prisma.user, 'create').mockResolvedValue({
        id: '3',
        email: createUserDto.email,
        password: hashedPassword,
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create(createUserDto);

      expect(hashSpy).toHaveBeenCalledWith(createUserDto.password, expect.any(Number));
      expect(result.password).toBe(hashedPassword);

      hashSpy.mockRestore();
    });
  });
});
