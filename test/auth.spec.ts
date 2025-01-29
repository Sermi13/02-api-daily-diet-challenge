import { execSync } from 'child_process';

import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';

import { app } from '../src/app';
import { knex } from '../src/database';

beforeAll(async () => {
  await app.ready();
  execSync('npm run knex migrate:latest');
});

afterAll(async () => {
  await app.close();
  await knex.destroy();
});

//Needs two delete calls since there will be some data still saved when it's called one time
beforeEach(async () => {
  await knex('users').delete();
  await knex('users').delete();
});

describe('Auth routes', () => {
  describe('Register', () => {
    test('User can register', async () => {
      await request(app.server)
        .post('/auth/register')
        .send({
          name: 'John Doe',
          email: 'johndoe@example.com',
          password: '123456Aa!',
        })
        .expect(201);
    });

    test('Fails when required fields are missing', async () => {
      await request(app.server).post('/auth/register').send({}).expect(400);
    });

    test('Fails when email is invalid', async () => {
      await request(app.server)
        .post('/auth/register')
        .send({ name: 'John Doe', email: 'invalid-email', password: '123456Aa!' })
        .expect(400);
    });

    test('Fails when email is already taken', async () => {
      const userData = {
        name: 'John Doe',
        email: 'johndoe@example.com',
        password: '123456Aa!',
      };

      await request(app.server).post('/auth/register').send(userData).expect(201);
      await request(app.server).post('/auth/register').send(userData).expect(409);
    });

    test('Should receive user data and Access Token', async () => {
      const userData = {
        name: 'John Doe',
        email: 'johndoe@example.com',
        password: '123456Aa!',
      };

      const response = await request(app.server).post('/auth/register').send(userData).expect(201);

      expect(response.body).toEqual({
        user: expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          email: expect.any(String),
          created_at: expect.any(String),
        }),
        accessToken: expect.any(String),
      });
    });
  });

  describe('Login', () => {
    test('User can log in with valid credentials', async () => {
      const userData = {
        email: 'johndoe@example.com',
        password: '123456Aa!',
      };

      await request(app.server)
        .post('/auth/register')
        .send({
          name: 'John Doe',
          ...userData,
        });

      const response = await request(app.server).post('/auth/login').send(userData).expect(200);

      expect(response.body).toEqual({
        user: expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          email: expect.any(String),
          created_at: expect.any(String),
        }),
        accessToken: expect.any(String),
      });
    });

    test('Fails when required fields are missing', async () => {
      await request(app.server).post('/auth/login').send({}).expect(400);
    });

    test('Fails when email is invalid', async () => {
      await request(app.server)
        .post('/auth/login')
        .send({ email: 'invalid-email', password: '123456Aa!' })
        .expect(400);
    });

    test('Fails when password is incorrect', async () => {
      const userData = {
        email: 'johndoe@example.com',
        password: '123456Aa!',
      };

      await request(app.server)
        .post('/auth/register')
        .send({
          name: 'John Doe',
          ...userData,
        });

      await request(app.server)
        .post('/auth/login')
        .send({ email: userData.email, password: 'WrongPass123!' })
        .expect(401);
    });

    test('Fails when user does not exist', async () => {
      await request(app.server)
        .post('/auth/login')
        .send({ email: 'nonexistent@example.com', password: '123456Aa!' })
        .expect(401);
    });

    test('Should receive user data and Access Token on successful login', async () => {
      const userData = {
        email: 'johndoe@example.com',
        password: '123456Aa!',
      };

      await request(app.server)
        .post('/auth/register')
        .send({
          name: 'John Doe',
          ...userData,
        });

      const response = await request(app.server).post('/auth/login').send(userData).expect(200);

      expect(response.body).toEqual({
        user: expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          email: expect.any(String),
          created_at: expect.any(String),
        }),
        accessToken: expect.any(String),
      });
    });
  });
});
