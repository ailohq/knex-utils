import Knex from "knex";

export interface CreateHistoryMigrationOptions {
  tableName: string;
  typeName: string;
  /**
   * @default "public"
   */
  schema?: string;
}

export function createHistoryMigration({
  schema = "public",
  ...rest
}: CreateHistoryMigrationOptions): Knex.Migration {
  return {
    up: createHistoryMigrationUp({ schema, ...rest }),
    down: createHistoryMigrationDown({ schema, ...rest }),
  };
}

function createHistoryMigrationUp({
  tableName,
  typeName,
  schema,
}: Omit<CreateHistoryMigrationOptions, "schema"> & { schema: string }) {
  return async (knex: Knex) => {
    await knex.schema.raw(`
        CREATE INDEX IF NOT EXISTS ${tableName}_sys_period ON ${schema}.${tableName}(sys_period)
    `);
    await knex.schema.raw(
      `CREATE TABLE ${schema}.${tableName}_history OF ${schema}.${typeName}`
    );
    await knex.schema.raw(`
        CREATE TRIGGER versioning_trigger
          BEFORE INSERT OR UPDATE OR DELETE ON ${schema}.${tableName}
          FOR EACH ROW EXECUTE PROCEDURE versioning(
            'sys_period', '${schema}.${tableName}_history', true
          )
      `);
    await knex.schema.raw(`
        CREATE INDEX ${tableName}_history_sys_period ON ${schema}.${tableName}_history(sys_period)
  `);
  };
}

function createHistoryMigrationDown({
  tableName,
  schema,
}: Omit<CreateHistoryMigrationOptions, "schema"> & { schema: string }) {
  return async (knex: Knex) => {
    await knex.schema.raw(
      `DROP TRIGGER versioning_trigger ON ${schema}.${tableName}`
    );
    await knex.schema.raw(`DROP TABLE ${schema}.${tableName}_history`);
    await knex.schema.raw(
      `DROP INDEX IF EXISTS ${schema}.${tableName}_sys_period`
    );
  };
}
