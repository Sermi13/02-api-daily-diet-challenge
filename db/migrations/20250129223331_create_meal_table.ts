import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('meals', (table) => {
    table.uuid('id').primary();
    table.uuid('user_id').unsigned();
    table.foreign('user_id').references('users.id');
    table.text('name').notNullable();
    table.timestamp('date').notNullable();
    table.text('description').notNullable();
    table.boolean('in_diet').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('meals');
}
