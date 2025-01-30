// eslint-disable-next-line
import { Knex } from 'knex';

declare module 'knex/types/tables' {
  export interface Tables {
    users: {
      id: string;
      name: string;
      email: string;
      password: string;
      image: string;
      created_at: string;
    };
    meals: {
      id: string;
      user_id: string;
      name: string;
      date: string;
      description: string;
      in_diet: boolean;
      created_at: string;
    };
  }
}
