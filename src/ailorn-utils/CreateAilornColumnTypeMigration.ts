import Knex from "knex";

export const CreateAilornColumnTypeMigration: Knex.Migration = {
  up(knex: Knex): Promise<void> {
    return knex.raw(
      "CREATE DOMAIN ailorn AS TEXT CHECK (VALUE ~ '^ailo:\\w+:\\w+:\\w+');"
    );
  },

  down(knex: Knex): Promise<void> {
    return knex.raw("DROP DOMAIN IF EXISTS ailorn;");
  },
};
