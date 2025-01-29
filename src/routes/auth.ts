import { randomUUID } from 'crypto';

import bcrypt from 'bcrypt';
import { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { knex } from '../database';
import { AuthViewModel } from '../viewmodel/auth.viewmodel';

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const createUserBodySchema = z.object({
      name: z.string().nonempty(),
      email: z.string().email(),
      password: z.string().nonempty(),
      image: z.string().base64().optional(),
    });

    const _userData = createUserBodySchema.safeParse(request.body);

    if (!_userData.success) {
      return reply.code(400).send({ code: 400, message: _userData.error.format() });
    }

    const { name, email, password, image } = _userData.data;

    const existingUser = await knex('users').where({ email }).first();

    if (existingUser) {
      return reply.code(409).send({ code: 409, message: 'Email is already in use' });
    }

    const userId = randomUUID();

    const passwordHash = await bcrypt.hash(password, 6);

    const [user] = await knex('users')
      .insert({
        id: userId,
        name,
        email,
        password: passwordHash,
        image,
      })
      .returning(['id', 'name', 'email', 'image', 'created_at']);

    const accessToken = app.jwt.sign({ id: userId }, { expiresIn: '7d' });

    return reply.code(201).send(AuthViewModel.registerToHttp(user, accessToken));
  });

  app.post('/login', async (request, reply) => {
    const loginBodySchema = z.object({
      email: z.string().email(),
      password: z.string().nonempty(),
    });

    const _loginData = loginBodySchema.safeParse(request.body);

    if (!_loginData.success) {
      reply.code(400).send({ code: 400, message: _loginData.error.format() });
    }

    const { email, password } = _loginData.data!;

    const user = await knex('users').where({ email }).first();

    if (!user) {
      return reply.code(401).send({ code: 401, message: 'Unauthorized' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return reply.code(401).send({ code: 401, message: 'Unauthorized' });
    }

    const accessToken = app.jwt.sign({ id: user.id }, { expiresIn: '7d' });

    return reply.code(200).send(AuthViewModel.loginToHttp(user, accessToken));
  });
}
