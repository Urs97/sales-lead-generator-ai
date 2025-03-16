import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { mockUser } from '@mocks/mock-user';

describe('UsersService', () => {
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
              create: jest.fn().mockResolvedValue(mockUser),
              findMany: jest.fn().mockResolvedValue([mockUser]),
              findUnique: jest.fn().mockResolvedValue(mockUser),
              update: jest.fn().mockResolvedValue(mockUser),
              delete: jest.fn().mockResolvedValue(mockUser),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'newuser@example.com',
        password: 'newpassword123',
      };
      await expect(service.create(createUserDto)).resolves.toEqual(mockUser);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: createUserDto,
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      await expect(service.findAll()).resolves.toEqual([mockUser]);
      expect(prisma.user.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by ID', async () => {
      const userId = '1';
      await expect(service.findOne(userId)).resolves.toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  });

  describe('update', () => {
    it('should update a user by ID', async () => {
      const userId = '1';
      const updateUserDto: UpdateUserDto = { email: 'updated@example.com' };
      await expect(service.update(userId, updateUserDto)).resolves.toEqual(mockUser);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateUserDto,
      });
    });
  });

  describe('remove', () => {
    it('should remove a user by ID', async () => {
      const userId = '1';
      await expect(service.remove(userId)).resolves.toEqual(mockUser);
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  });
});
