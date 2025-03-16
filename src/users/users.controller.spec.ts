import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { mockUser } from '@mocks/mock-user';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockUser),
            findAll: jest.fn().mockResolvedValue([mockUser]),
            findOne: jest.fn().mockResolvedValue(mockUser),
            update: jest.fn().mockResolvedValue(mockUser),
            remove: jest.fn().mockResolvedValue(mockUser),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'newuser@example.com',
        password: 'newpassword123',
      };
      await expect(controller.create(createUserDto)).resolves.toEqual(mockUser);
      expect(service.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      await expect(controller.findAll()).resolves.toEqual([mockUser]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by ID', async () => {
      const userId = '1';
      await expect(controller.findOne(userId)).resolves.toEqual(mockUser);
      expect(service.findOne).toHaveBeenCalledWith(userId);
    });
  });

  describe('update', () => {
    it('should update a user by ID', async () => {
      const userId = '1';
      const updateUserDto: UpdateUserDto = { email: 'updated@example.com' };
      await expect(controller.update(userId, updateUserDto)).resolves.toEqual(mockUser);
      expect(service.update).toHaveBeenCalledWith(userId, updateUserDto);
    });
  });

  describe('remove', () => {
    it('should remove a user by ID', async () => {
      const userId = '1';
      await expect(controller.remove(userId)).resolves.toEqual(mockUser);
      expect(service.remove).toHaveBeenCalledWith(userId);
    });
  });
});
