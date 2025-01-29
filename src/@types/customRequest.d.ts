import { User } from './entities';

declare module 'fastify' {
  interface FastifyRequest {
    userData: User;
  }
}
