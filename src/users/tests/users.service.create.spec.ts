import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { Role, Prisma } from '@prisma/client';
import { User } from '../entities/user.entity';

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

    jest.spyOn(prisma.user, 'create').mockImplementation((args) =>
      Promise.resolve({
        id: '2',
        ...args.data,
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      }) as unknown as Prisma.Prisma__UserClient<User>,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new user', async () => {
    const createUserDto: CreateUserDto = {
      email: 'newuser@example.com',
      password: 'newpassword123',
    };

    await expect(service.create(createUserDto)).resolves.toMatchObject({
      email: 'newuser@example.com',
      password: expect.any(String),
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: createUserDto,
    });
  });

  it('should throw an error if email already exists', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: '1',
      email: 'existinguser@example.com',
      password: 'hashedpassword123',
      role: Role.USER,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      service.create({ email: 'existinguser@example.com', password: 'validPass123' })
    ).rejects.toThrow('User already exists');

    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('should throw an error if password is too short', async () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      password: '123',
    };

    await expect(service.create(createUserDto)).rejects.toThrow();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('should hash the password before saving', async () => {
    const createUserDto: CreateUserDto = {
      email: 'secure@example.com',
      password: 'securepassword',
    };

    const result = await service.create(createUserDto);

    expect(result.password).not.toBe(createUserDto.password);
  });
});
