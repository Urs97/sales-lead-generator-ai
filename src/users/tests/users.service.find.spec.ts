import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';

describe('UsersService - Find Users', () => {
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
              findMany: jest.fn(),
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

  describe('findAll', () => {
    it('should return an array of users', async () => {
      jest.spyOn(prisma.user, 'findMany').mockResolvedValue([
        {
          id: '1',
          email: 'testuser@example.com',
          password: 'hashedpassword123',
          role: Role.USER,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      await expect(service.findAll()).resolves.toEqual([
        expect.objectContaining({
          id: '1',
          email: 'testuser@example.com',
        }),
      ]);

      expect(prisma.user.findMany).toHaveBeenCalled();
    });

    it('should return an empty array if no users exist', async () => {
      jest.spyOn(prisma.user, 'findMany').mockResolvedValue([]);

      await expect(service.findAll()).resolves.toEqual([]);
      expect(prisma.user.findMany).toHaveBeenCalled();
    });

    it('should return multiple users', async () => {
      jest.spyOn(prisma.user, 'findMany').mockResolvedValue([
        {
          id: '1',
          email: 'user1@example.com',
          password: 'hashedpassword123',
          role: Role.USER,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          email: 'user2@example.com',
          password: 'hashedpassword456',
          role: Role.ADMIN,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      await expect(service.findAll()).resolves.toEqual([
        expect.objectContaining({ id: '1', email: 'user1@example.com' }),
        expect.objectContaining({ id: '2', email: 'user2@example.com' }),
      ]);

      expect(prisma.user.findMany).toHaveBeenCalled();
    });

    it('should throw an error if Prisma throws an error', async () => {
      jest.spyOn(prisma.user, 'findMany').mockRejectedValue(new Error('Database error'));

      await expect(service.findAll()).rejects.toThrow('Database error');
      expect(prisma.user.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by ID', async () => {
      const userId = '1';

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: '1',
        email: 'testuser@example.com',
        password: 'hashedpassword123',
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.findOne(userId)).resolves.toMatchObject({
        id: '1',
        email: 'testuser@example.com',
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it('should return a full user object with all properties', async () => {
      const userId = '2';

      const mockUser = {
        id: '2',
        email: 'fulluser@example.com',
        password: 'hashedpassword123',
        role: Role.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      await expect(service.findOne(userId)).resolves.toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: userId } });
    });

    it('should return null if user does not exist', async () => {
      const userId = '999';

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne(userId)).resolves.toBeNull();
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it('should handle invalid user ID formats', async () => {
      const invalidId = 'invalid_id';

      await expect(service.findOne(invalidId)).rejects.toThrow('Invalid user ID');
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should throw an error if Prisma encounters a database issue', async () => {
      const userId = '3';

      jest.spyOn(prisma.user, 'findUnique').mockRejectedValue(new Error('Database connection error'));

      await expect(service.findOne(userId)).rejects.toThrow('Database connection error');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  });
});
