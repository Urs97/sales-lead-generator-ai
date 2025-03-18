import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Users API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "User" RESTART IDENTITY CASCADE;`);
  });

  describe('POST /users', () => {
    it('should create a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({ email: 'test@example.com' });

      const userInDb = await prisma.user.findUnique({ where: { email: 'test@example.com' } });
      expect(userInDb).not.toBeNull();
    });

    it('should hash the password before saving', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({ email: 'secure@example.com', password: 'securepassword' });

      expect(response.status).toBe(201);

      const userInDb = await prisma.user.findUnique({ where: { email: 'secure@example.com' } });

      if (userInDb) {
        expect(userInDb.password).not.toBe('securepassword');
      }
    });

    it('should return 400 if email is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({ email: 'invalid-email', password: 'password123' });

      expect(response.status).toBe(400);
    });

    it('should return 409 if email already exists', async () => {
      await prisma.user.create({
        data: { email: 'duplicate@example.com', password: 'hashedpassword' },
      });

      const response = await request(app.getHttpServer())
        .post('/users')
        .send({ email: 'duplicate@example.com', password: 'password123' });

      expect(response.status).toBe(409);
    });
  });

  describe('GET /users', () => {
    it('should return a list of users', async () => {
      await prisma.user.create({
        data: { email: 'list@example.com', password: 'hashedpassword' },
      });

      const response = await request(app.getHttpServer()).get('/users');

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /users/:id', () => {
    it('should return a user by ID', async () => {
      const user = await prisma.user.create({
        data: { email: 'singleuser@example.com', password: 'hashedpassword' },
      });

      const response = await request(app.getHttpServer()).get(`/users/${user.id}`);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe('singleuser@example.com');
    });

    it('should return 404 if user does not exist', async () => {
      const response = await request(app.getHttpServer()).get('/users/999');

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /users/:id', () => {
    it('should update user email', async () => {
      const user = await prisma.user.create({
        data: { email: 'update@example.com', password: 'hashedpassword' },
      });

      const response = await request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .send({ email: 'newemail@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.email).toBe('newemail@example.com');
    });

    it('should hash password when updating', async () => {
      const user = await prisma.user.create({
        data: { email: 'changepass@example.com', password: 'hashedpassword' },
      });

      const response = await request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .send({ password: 'newpassword123' });

      expect(response.status).toBe(200);

      const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });

      if (updatedUser) {
        expect(updatedUser.password).not.toBe('newpassword123');
      }
    });

    it('should return 400 if email format is invalid', async () => {
      const user = await prisma.user.create({
        data: { email: 'valid@example.com', password: 'hashedpassword' },
      });

      const response = await request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .send({ email: 'invalid-email' });

      expect(response.status).toBe(400);
    });

    it('should return 404 if user does not exist', async () => {
      const response = await request(app.getHttpServer())
        .patch('/users/999')
        .send({ email: 'newemail@example.com' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete a user', async () => {
      const user = await prisma.user.create({
        data: { email: 'delete@example.com', password: 'hashedpassword' },
      });

      const response = await request(app.getHttpServer()).delete(`/users/${user.id}`);

      expect(response.status).toBe(200);

      const userInDb = await prisma.user.findUnique({ where: { id: user.id } });
      expect(userInDb).toBeNull();
    });

    it('should return 404 if user does not exist', async () => {
      const response = await request(app.getHttpServer()).delete('/users/999');

      expect(response.status).toBe(404);
    });
  });
});
