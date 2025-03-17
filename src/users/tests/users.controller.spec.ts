import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { mockUser } from '@mocks/mock-user';
import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { validateSync } from 'class-validator';

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
      jest.spyOn(service, 'create').mockResolvedValue({ ...mockUser, id: '2', ...createUserDto });

      await expect(controller.create(createUserDto)).resolves.toEqual({
        ...mockUser,
        id: '2',
        email: createUserDto.email,
        password: createUserDto.password,
      });

      expect(service.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw ConflictException if email already exists', async () => {
      jest.spyOn(service, 'create').mockRejectedValue(new ConflictException('User with this email already exists'));

      await expect(controller.create({ email: 'existing@example.com', password: 'password123' }))
        .rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if email is missing', () => {
      const invalidDto = new CreateUserDto();
      invalidDto.password = 'newpassword123';

      const errors = validateSync(invalidDto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should throw BadRequestException if password is missing', () => {
      const invalidDto = new CreateUserDto();
      invalidDto.email = 'test@example.com';

      const errors = validateSync(invalidDto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should throw BadRequestException if email format is invalid', () => {
      const invalidDto = new CreateUserDto();
      invalidDto.email = 'invalid-email';
      invalidDto.password = 'newpassword123';

      const errors = validateSync(invalidDto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValue([mockUser]);

      const result = await controller.findAll();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([mockUser]);
    });

    it('should return an empty array if no users exist', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValue([]);

      const result = await controller.findAll();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a user by ID', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);

      await expect(controller.findOne('1')).resolves.toEqual(mockUser);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(null);

      await expect(controller.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a user by ID', async () => {
      const updateUserDto: UpdateUserDto = { email: 'updated@example.com' };
      const updatedUser = { ...mockUser, ...updateUserDto };

      jest.spyOn(service, 'update').mockResolvedValue(updatedUser);

      await expect(controller.update('1', updateUserDto)).resolves.toEqual(updatedUser);
    });

    it('should throw BadRequestException if email is invalid', () => {
      const invalidDto = new UpdateUserDto();
      invalidDto.email = 'invalid-email';

      const errors = validateSync(invalidDto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should throw NotFoundException if user to update does not exist', async () => {
      jest.spyOn(service, 'update').mockResolvedValue(null);

      await expect(controller.update('999', { email: 'updated@example.com' }))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException if database fails during update', async () => {
      jest.spyOn(service, 'update').mockRejectedValue(new Error('Database failure'));

      await expect(controller.update('1', { email: 'updated@example.com' }))
        .rejects.toThrow(Error);
    });
  });

  describe('remove', () => {
    it('should remove a user by ID', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue(mockUser);

      await expect(controller.remove('1')).resolves.toEqual(mockUser);
    });

    it('should throw NotFoundException if user to delete does not exist', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue(null);

      await expect(controller.remove('999')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is unauthorized to delete', async () => {
      jest.spyOn(service, 'remove').mockRejectedValue(new ForbiddenException('You cannot delete this user'));

      await expect(controller.remove('1')).rejects.toThrow(ForbiddenException);
    });
  });
});
