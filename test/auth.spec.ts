import { execSync } from 'child_process';

import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, test, vitest } from 'vitest';

import { app } from '../src/app';
import { knex } from '../src/database';

beforeAll(async () => {
  await app.ready();
});

afterAll(async () => {
  await app.close();
  await knex.destroy();
});

beforeEach(async () => {
  execSync('npm run knex migrate:rollback -all');
  execSync('npm run knex migrate:latest');
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
});
