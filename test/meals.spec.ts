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

describe('Update', () => {
  test('User can update a meal', async () => {
    // First, create a meal to update
    const createResponse = await request(app.server)
      .post('/meals')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Grilled Chicken Salad',
        description: 'Healthy meal with grilled chicken and veggies',
        in_diet: true,
      })
      .expect(201);

    const mealId = createResponse.body.meal.id;

    // Now, update the created meal
    const updateResponse = await request(app.server)
      .put(`/meals/${mealId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Updated Grilled Chicken Salad',
        description: 'Updated healthy meal with grilled chicken and veggies',
        in_diet: false,
      })
      .expect(200);

    expect(updateResponse.body).toEqual({
      meal: expect.objectContaining({
        id: mealId, // should match the original meal's id
        user_id: expect.any(String),
        name: 'Updated Grilled Chicken Salad',
        description: 'Updated healthy meal with grilled chicken and veggies',
        in_diet: false, // updated value
        created_at: expect.any(String),
      }),
    });
  });

  test('Cannot update meal without required fields', async () => {
    // First, create a meal to update
    const createResponse = await request(app.server)
      .post('/meals')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Grilled Chicken Salad',
        description: 'Healthy meal with grilled chicken and veggies',
        in_diet: true,
      })
      .expect(201);

    const mealId = createResponse.body.meal.id;

    // Now, try updating without a required field (e.g., description)
    await request(app.server)
      .put(`/meals/${mealId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Updated Grilled Chicken Salad',
        in_diet: false,
      })
      .expect(400); // Expect 400 for missing description
  });

  test('Unauthorized user cannot update meal', async () => {
    // First, create a meal to update
    const createResponse = await request(app.server)
      .post('/meals')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Grilled Chicken Salad',
        description: 'Healthy meal with grilled chicken and veggies',
        in_diet: true,
      })
      .expect(201);

    const mealId = createResponse.body.meal.id;

    // Try updating the meal with an invalid token
    await request(app.server)
      .put(`/meals/${mealId}`)
      .set('Authorization', `Bearer invalidtoken`)
      .send({
        name: 'Updated Grilled Chicken Salad',
        description: 'Updated healthy meal with grilled chicken and veggies',
        in_diet: false,
      })
      .expect(401); // Expect unauthorized response
  });

  test('User cannot update a meal they did not create', async () => {
    // First, create a meal with the original user
    const createResponse = await request(app.server)
      .post('/meals')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Grilled Chicken Salad',
        description: 'Healthy meal with grilled chicken and veggies',
        in_diet: true,
      })
      .expect(201);

    const mealId = createResponse.body.meal.id;

    // Create another user and get a new access token for them
    const otherUserData = {
      name: 'Jane Doe',
      email: `${randomUUID()}@example.com`,
      password: '123456Aa!',
    };

    const otherUserResponse = await request(app.server).post('/auth/register').send(otherUserData);

    const otherUserToken = otherUserResponse.body.accessToken;

    // Try updating the meal with the second user's token (they shouldn't be able to update it)
    await request(app.server)
      .put(`/meals/${mealId}`)
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send({
        name: 'Updated Grilled Chicken Salad',
        description: 'Updated healthy meal with grilled chicken and veggies',
        in_diet: false,
      })
      .expect(403); // Expect forbidden error as the user didn't create the meal
  });
});
