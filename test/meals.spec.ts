import { execSync } from 'child_process';
import { randomUUID } from 'crypto';

import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';

import { app } from '../src/app';
import { knex } from '../src/database';

let accessToken: string;

beforeAll(async () => {
  await app.ready();
  execSync('npm run knex migrate:latest');

  const userData = {
    name: 'John Doe',
    email: `${randomUUID()}@example.com`,
    password: '123456Aa!',
  };

  const response = await request(app.server).post('/auth/register').send(userData);

  accessToken = response.body.accessToken;
});

beforeEach(async () => {
  await knex('meals').delete();
  await knex('meals').delete();
});

afterAll(async () => {
  await app.close();
  await knex('users').delete();
  await knex('users').delete();
  await knex.destroy();
});

describe('Meal routes', () => {
  describe('Create', () => {
    test('User can create a meal', async () => {
      const response = await request(app.server)
        .post('/meals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Grilled Chicken Salad',
          description: 'Healthy meal with grilled chicken and veggies',
          in_diet: true,
        })
        .expect(201);

      expect(response.body).toEqual({
        meal: expect.objectContaining({
          id: expect.any(String),
          user_id: expect.any(String),
          name: 'Grilled Chicken Salad',
          description: 'Healthy meal with grilled chicken and veggies',
          in_diet: true,
          created_at: expect.any(String),
        }),
      });
    });
    test('Missing property', async () => {
      await request(app.server)
        .post('/meals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Grilled Chicken Salad',
          in_diet: true,
        })
        .expect(400);
    });
    test('Invalid authorization', async () => {
      await request(app.server)
        .post('/meals')
        .set('Authorization', `Bearer invalidtoken`)
        .send({
          name: 'Grilled Chicken Salad',
          description: 'Healthy meal with grilled chicken and veggies',
          in_diet: true,
        })
        .expect(401);
    });
  });
});
