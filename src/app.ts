import cookie from '@fastify/cookie';
import fastifyJwt from '@fastify/jwt';
import fastify from 'fastify';

import { env } from './env';
import { actuatorRoutes } from './routes/actuator';
import { authRoutes } from './routes/auth';
import { mealsRoutes } from './routes/meals';

export const app = fastify();

app.register(cookie);
app.register(fastifyJwt, { secret: env.JWT_SECRET });
app.register(authRoutes, { prefix: 'auth' });
app.register(actuatorRoutes, { prefix: 'actuator' });
app.register(mealsRoutes, { prefix: 'meals' });
