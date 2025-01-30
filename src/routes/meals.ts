import { randomUUID } from 'crypto';

import { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { knex } from '../database';
import { jwtVerify } from '../middlewares/jwtVerify';
import { MealsViewModel } from '../viewmodel/meals.viewmodel';

export async function mealsRoutes(app: FastifyInstance) {
  app.post('/', { preHandler: [jwtVerify] }, async (request, reply) => {
    const createMealBodySchema = z.object({
      name: z.string(),
      date: z.string().datetime(),
      description: z.string(),
      in_diet: z.boolean(),
    });

    const _mealData = createMealBodySchema.safeParse(request.body);

    if (!_mealData.success) {
      return reply.code(400).send({ code: 400, message: _mealData.error.format() });
    }

    const { name, date, description, in_diet } = _mealData.data;

    const [meal] = await knex('meals')
      .insert({
        id: randomUUID(),
        user_id: request.userData.id,
        name,
        date,
        description,
        in_diet,
      })
      .returning(['id', 'user_id', 'name', 'date', 'description', 'in_diet', 'created_at']);

    return reply.code(201).send(MealsViewModel.createToHttp(meal));
  });

  app.put('/:id', { preHandler: [jwtVerify] }, async (request, reply) => {
    const updateMealBodySchema = z.object({
      name: z.string(),
      date: z.string().datetime(),
      description: z.string(),
      in_diet: z.boolean(),
    });

    const _mealData = updateMealBodySchema.safeParse(request.body);

    if (!_mealData.success) {
      return reply.code(400).send({ code: 400, message: _mealData.error.format() });
    }

    const { name, date, description, in_diet } = _mealData.data;

    const { id } = request.params as { id: string };
    const mealFound = await knex('meals').where({ id }).first();

    if (!mealFound) {
      return reply.code(404).send({ code: 404, message: 'Not found' });
    }

    if (mealFound.user_id !== request.userData.id) {
      return reply.code(403).send({ code: 404, message: 'Forbidden' });
    }

    const [mealUpdated] = await knex('meals')
      .where({ id })
      .update({
        name,
        date,
        description,
        in_diet,
      })
      .returning(['id', 'user_id', 'name', 'date', 'description', 'in_diet', 'created_at']);

    return reply.code(200).send(MealsViewModel.updateToHttp(mealUpdated));
  });

  app.delete('/:id', { preHandler: [jwtVerify] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const mealFound = await knex('meals').where({ id }).first();

    if (!mealFound) {
      return reply.code(404).send({ code: 404, message: 'Not found' });
    }

    if (mealFound.user_id !== request.userData.id) {
      return reply.code(403).send({ code: 404, message: 'Forbidden' });
    }

    await knex('meals').where({ id }).delete();

    return reply.code(200).send();
  });

  app.get('/', { preHandler: [jwtVerify] }, async (request, reply) => {
    const meals = await knex('meals').where({ user_id: request.userData.id });

    return reply.code(200).send(MealsViewModel.listToHttp(meals));
  });

  app.get('/:id', { preHandler: [jwtVerify] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const meal = await knex('meals').where({ id }).first();

    if (!meal) {
      return reply.code(404).send({ code: 404, message: 'Not found' });
    }

    if (meal.user_id !== request.userData.id) {
      return reply.code(403).send({ code: 404, message: 'Forbidden' });
    }

    return reply.code(200).send(MealsViewModel.detailToHttp(meal));
  });

  app.get('/summary', { preHandler: [jwtVerify] }, async (request, reply) => {
    const meals = await knex('meals').where({ user_id: request.userData.id });

    const totalMeals = meals.length;

    const totalMealsInDiet = meals.filter((meal) => meal.in_diet).length;

    const totalMealsOutOfDiet = meals.filter((meal) => !meal.in_diet).length;

    // Calculate the longest streak of consecutive meals in diet
    let longestDietStreak = 0;
    let currentStreak = 0;
    let previousDate: Date | null = null;

    meals.forEach((meal) => {
      // Check if the current meal is in diet and is the next day in sequence
      if (meal.in_diet) {
        if (previousDate && isNextDay(previousDate, new Date(meal.date))) {
          currentStreak++; // Consecutive streak
        } else {
          currentStreak = 1; // Start new streak
        }
        longestDietStreak = Math.max(longestDietStreak, currentStreak); // Update max streak
      } else {
        currentStreak = 0;
      }
      previousDate = new Date(meal.date);
    });

    function isNextDay(previous: Date, current: Date) {
      const prevDate = new Date(previous);
      const currDate = new Date(current);

      prevDate.setHours(0, 0, 0, 0);
      currDate.setHours(0, 0, 0, 0);

      const diffTime = currDate.getTime() - prevDate.getTime();
      const oneDay = 24 * 60 * 60 * 1000;
      console.log(prevDate, currDate, diffTime === oneDay);
      return diffTime === oneDay;
    }

    return reply.code(200).send(
      MealsViewModel.summaryToHttp({
        totalMeals,
        totalMealsInDiet,
        totalMealsOutOfDiet,
        longestDietStreak,
      }),
    );
  });
}
