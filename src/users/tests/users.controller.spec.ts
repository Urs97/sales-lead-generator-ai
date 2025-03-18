import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { mockUser } from '@mocks/mock-user';
import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';

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
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = { email: 'newuser@example.com', password: 'newpassword123' };

      jest.spyOn(service, 'create').mockResolvedValueOnce({ ...mockUser, id: '2', ...createUserDto });

      await expect(controller.create(createUserDto)).resolves.toEqual({
        ...mockUser,
        id: '2',
        email: createUserDto.email,
        password: createUserDto.password,
      });

      expect(service.create).toHaveBeenCalledWith(createUserDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException if email already exists', async () => {
      jest.spyOn(service, 'create').mockRejectedValueOnce(new ConflictException());

      await expect(controller.create({ email: 'existing@example.com', password: 'password123' }))
        .rejects.toThrow(ConflictException);

      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValueOnce([mockUser]);

      await expect(controller.findAll()).resolves.toEqual([mockUser]);

      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array if no users exist', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValueOnce([]);

      await expect(controller.findAll()).resolves.toEqual([]);

      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a user by ID', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(mockUser);

      await expect(controller.findOne('1')).resolves.toEqual(mockUser);

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValueOnce(new NotFoundException());

      await expect(controller.findOne('999')).rejects.toThrow(NotFoundException);

      expect(service.findOne).toHaveBeenCalledWith('999');
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update a user by ID', async () => {
      const updateUserDto: UpdateUserDto = { email: 'updated@example.com' };
      const updatedUser = { ...mockUser, ...updateUserDto };

      jest.spyOn(service, 'update').mockResolvedValueOnce(updatedUser);

      await expect(controller.update('1', updateUserDto)).resolves.toEqual(updatedUser);

      expect(service.update).toHaveBeenCalledWith('1', updateUserDto);
      expect(service.update).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if user to update does not exist', async () => {
      jest.spyOn(service, 'update').mockRejectedValueOnce(new NotFoundException());

      await expect(controller.update('999', { email: 'updated@example.com' }))
        .rejects.toThrow(NotFoundException);

      expect(service.update).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException if email is already in use', async () => {
      jest.spyOn(service, 'update').mockRejectedValueOnce(new ConflictException());

      await expect(controller.update('1', { email: 'existing@example.com' }))
        .rejects.toThrow(ConflictException);

      expect(service.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('should remove a user by ID', async () => {
      jest.spyOn(service, 'remove').mockResolvedValueOnce(mockUser);

      await expect(controller.remove('1')).resolves.toEqual(mockUser);

      expect(service.remove).toHaveBeenCalledWith('1');
      expect(service.remove).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if user to delete does not exist', async () => {
      jest.spyOn(service, 'remove').mockRejectedValueOnce(new NotFoundException());

      await expect(controller.remove('999')).rejects.toThrow(NotFoundException);

      expect(service.remove).toHaveBeenCalledWith('999');
      expect(service.remove).toHaveBeenCalledTimes(1);
    });

    it('should throw ForbiddenException if user is unauthorized to delete', async () => {
      jest.spyOn(service, 'remove').mockRejectedValueOnce(new ForbiddenException());

      await expect(controller.remove('1')).rejects.toThrow(ForbiddenException);

      expect(service.remove).toHaveBeenCalledTimes(1);
    });
  });
});
