import cookie from '@fastify/cookie';
import fastify from 'fastify';

import fastifyJwt from '@fastify/jwt';
import { env } from './env';
import { authRoutes } from './routes/auth';

export const app = fastify();

app.register(cookie);
app.register(fastifyJwt, { secret: env.JWT_SECRET });
app.register(authRoutes, { prefix: 'auth' });
