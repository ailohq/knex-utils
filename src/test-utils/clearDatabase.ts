import type Knex from "knex";

export interface ClearDatabaseConfig {
  /**
   * Additional schemas that should be dropped. (e.g. `['views']`)
   */
  dropSchemas?: string[];
}

/**
 * Removes all schemas (tables, views, etc.) from the current database.
 */
export async function clearDatabase(
  knex: Knex,
  { dropSchemas = [] }: ClearDatabaseConfig = {}
): Promise<void> {
  if (process.env.NODE_ENV !== "test") {
    throw new Error(
      `For safety reasons, clearDatabase() is disabled on non-test envs.
       Are you sure you ran your tests in a correct way?`
    );
  }

  await knex.raw("DROP SCHEMA public CASCADE");
  await knex.raw("CREATE SCHEMA public");
  await knex.raw("GRANT ALL ON SCHEMA public TO public");

  await Promise.all(
    dropSchemas.map((schema) =>
      knex.raw(`DROP SCHEMA IF EXISTS ${schema} CASCADE`)
    )
  );
}
