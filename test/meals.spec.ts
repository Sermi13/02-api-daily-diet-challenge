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

      const otherUserResponse = await request(app.server)
        .post('/auth/register')
        .send(otherUserData);

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

  describe('Delete', () => {
    test('User can delete a meal', async () => {
      // First, create a meal to delete
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

      // Now, delete the created meal
      await request(app.server)
        .delete(`/meals/${mealId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200); // Expect success (status 200)

      // Try to fetch the deleted meal (should not exist)
      await request(app.server)
        .get(`/meals/${mealId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404); // Expect 404 as the meal should not exist anymore
    });

    test('Cannot delete a meal without proper authorization', async () => {
      // First, create a meal to delete
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

      // Try deleting the meal with an invalid token
      await request(app.server)
        .delete(`/meals/${mealId}`)
        .set('Authorization', `Bearer invalidtoken`)
        .expect(401); // Expect unauthorized (status 401)
    });

    test('User cannot delete a meal they did not create', async () => {
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

      const otherUserResponse = await request(app.server)
        .post('/auth/register')
        .send(otherUserData);

      const otherUserToken = otherUserResponse.body.accessToken;

      // Try deleting the meal with the second user's token (they shouldn't be able to delete it)
      await request(app.server)
        .delete(`/meals/${mealId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403); // Expect forbidden (status 403) as the user didn't create the meal
    });
  });
  describe('List', () => {
    test('User can list their meals', async () => {
      // First, create two meals for the user
      const createResponse1 = await request(app.server)
        .post('/meals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Grilled Chicken Salad',
          description: 'Healthy meal with grilled chicken and veggies',
          in_diet: true,
        })
        .expect(201);

      const createResponse2 = await request(app.server)
        .post('/meals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Vegan Buddha Bowl',
          description: 'A healthy and vegan meal with grains and vegetables',
          in_diet: true,
        })
        .expect(201);

      // Now, fetch all meals created by the user
      const listResponse = await request(app.server)
        .get('/meals')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Assert that the response contains both meals
      expect(listResponse.body.meals).toHaveLength(2); // Two meals should be returned
      expect(listResponse.body.meals).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: createResponse1.body.meal.id,
            name: 'Grilled Chicken Salad',
            description: 'Healthy meal with grilled chicken and veggies',
            in_diet: true,
          }),
          expect.objectContaining({
            id: createResponse2.body.meal.id,
            name: 'Vegan Buddha Bowl',
            description: 'A healthy and vegan meal with grains and vegetables',
            in_diet: true,
          }),
        ]),
      );
    });

    test('User can only list their own meals', async () => {
      // First, create a meal for the user
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

      const otherUserResponse = await request(app.server)
        .post('/auth/register')
        .send(otherUserData);

      const otherUserToken = otherUserResponse.body.accessToken;

      // Try fetching meals for the other user (should not list the original user's meals)
      const otherUserListResponse = await request(app.server)
        .get('/meals')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(200);

      // Assert that the meals from the first user are not in the second user's list
      expect(otherUserListResponse.body.meals).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: mealId,
            name: 'Grilled Chicken Salad',
          }),
        ]),
      );
    });

    test('Unauthorized user cannot list meals', async () => {
      // Try listing meals with an invalid token
      await request(app.server)
        .get('/meals')
        .set('Authorization', `Bearer invalidtoken`)
        .expect(401); // Expect unauthorized (status 401)
    });
  });
  describe('Get Meal details', () => {
    test('User can get details of a single meal', async () => {
      // First, create a meal for the user
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

      // Now, fetch details of the created meal
      const getResponse = await request(app.server)
        .get(`/meals/${mealId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Assert that the response matches the expected format and values
      expect(getResponse.body).toEqual({
        meal: {
          id: mealId,
          user_id: expect.any(String), // Expecting a user ID in the response
          name: 'Grilled Chicken Salad',
          description: 'Healthy meal with grilled chicken and veggies',
          in_diet: true,
          created_at: expect.any(String), // Expecting a valid timestamp
        },
      });
    });

    test('User cannot get details of a meal they did not create', async () => {
      // First, create a meal for the user
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

      const otherUserResponse = await request(app.server)
        .post('/auth/register')
        .send(otherUserData);

      const otherUserToken = otherUserResponse.body.accessToken;

      // Try fetching details of the meal with the second user's token (they shouldn't be able to access it)
      await request(app.server)
        .get(`/meals/${mealId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403); // Expect forbidden error as the user didn't create the meal
    });

    test('Unauthorized user cannot get meal details', async () => {
      // Try fetching meal details with an invalid token
      await request(app.server)
        .get('/meals/someMealId') // Pass a random meal ID
        .set('Authorization', `Bearer invalidtoken`)
        .expect(401); // Expect unauthorized (status 401)
    });

    test('Returns 404 if meal does not exist', async () => {
      // Try fetching a meal with an ID that doesn't exist
      await request(app.server)
        .get('/meals/nonexistentMealId') // Pass a non-existent meal ID
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404); // Expect not found (status 404)
    });
  });
});
