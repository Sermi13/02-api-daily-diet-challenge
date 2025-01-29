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
      description: z.string(),
      in_diet: z.boolean(),
    });

    const _mealData = createMealBodySchema.safeParse(request.body);

    if (!_mealData.success) {
      return reply.code(400).send({ code: 400, message: _mealData.error.format() });
    }

    const { name, description, in_diet } = _mealData.data;

    const [meal] = await knex('meals')
      .insert({
        id: randomUUID(),
        user_id: request.userData.id,
        name,
        description,
        in_diet,
      })
      .returning(['id', 'user_id', 'name', 'description', 'in_diet', 'created_at']);

    return reply.code(201).send(MealsViewModel.createToHttp(meal));
  });

  app.put('/:id', { preHandler: [jwtVerify] }, async (request, reply) => {
    const updateMealBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      in_diet: z.boolean(),
    });

    const _mealData = updateMealBodySchema.safeParse(request.body);

    if (!_mealData.success) {
      return reply.code(400).send({ code: 400, message: _mealData.error.format() });
    }

    const { name, description, in_diet } = _mealData.data;

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
        description,
        in_diet,
      })
      .returning(['id', 'user_id', 'name', 'description', 'in_diet', 'created_at']);

    return reply.code(200).send(MealsViewModel.createToHttp(mealUpdated));
  });
}
