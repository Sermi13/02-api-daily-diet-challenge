import { FastifyInstance } from 'fastify';

export async function actuatorRoutes(app: FastifyInstance) {
  app.get('/health', async () => {
    return { message: 'Ok' };
  });
}
