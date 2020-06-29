import type Knex from "knex";

export interface TruncateDatabaseConfig {
  /**
   * If true, `knex_migrations` table won't be cleared.
   *
   * Default value: `false`.
   */
  keepMigrations?: boolean;
  /**
   * List of schema names in which we'll truncate all the tables.
   *
   * Default value: `['public']`
   */
  schemas?: string[];
  /**
   * List of table names that should be skipped when truncating the database.
   *
   * @example ['roles']
   */
  skipTables?: string[];
  /**
   * List of table names that should be truncated first before all the other ones.
   *
   * If they don't belong to `public` schema, prefix them with the schema name, e.g. `views.users`.
   */
  deleteFromFirst?: string[];
}

/**
 * Removes all existing rows from the database.
 * (It doesn't remove the schemas.)
 */
export async function truncateDatabase(
  knex: Knex,
  {
    keepMigrations = false,
    schemas = ["public"],
    skipTables = [],
    deleteFromFirst = [],
  }: TruncateDatabaseConfig = {}
) {
  return knex.raw(`
do
$$
declare
  l_stmt text;
begin

  ${deleteFromFirst.map((tableName) => `DELETE FROM ${tableName};`).join("\n")}

  select 'truncate ' || string_agg(format('%I.%I', schemaname, tablename), ',')
  into l_stmt
  from pg_tables
  where schemaname in (${schemas.map((n) => `'${n}'`).join(",")})
  AND ${
    skipTables.length > 0
      ? `tablename not in (${skipTables.map((n) => `'${n}'`).join(",")})`
      : "1=1"
  }
  AND ${keepMigrations ? "tablename not in ('knex_migrations')" : "1=1"}
  ;

execute l_stmt;
end;
$$
`);
}
