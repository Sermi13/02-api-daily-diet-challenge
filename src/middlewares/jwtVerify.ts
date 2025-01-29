import { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';

import { JwtPayload } from '../@types/jwt';
import { knex } from '../database';
import { env } from '../env';

export async function jwtVerify(request: FastifyRequest, reply: FastifyReply) {
  const auth = request.headers.authorization;
  if (!auth) {
    return reply.code(401).send({
      code: 401,
      message: 'Unauthorized, missing Authorization bearer key',
    });
  }
  const token = auth.split(' ')[1];
  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch {
    return reply.code(401).send({
      code: 401,
      message: 'Unauthorized, missing or invalid Authorization bearer key',
    });
  }

  const user = await knex.table('users').where({ id: payload.id }).first();

  if (!user) {
    console.log("couldn't find user");
    return reply.code(401).send({
      code: 401,
      message: 'Unauthorized, missing Authorization bearer key',
    });
  }

  const { id, created_at, email, image, name } = user;
  request.user = id;
  request.userData = {
    id,
    name,
    email,
    image,
    created_at,
  };
}
