import Knex from "knex";

export interface CreateHistoryMigrationOptions {
  tableName: string;
  typeName: string;
}

export function createHistoryMigration(
  options: CreateHistoryMigrationOptions
): Knex.Migration {
  return {
    up: createHistoryMigrationUp(options),
    down: createHistoryMigrationDown(options),
  };
}

function createHistoryMigrationUp({
  tableName,
  typeName,
}: CreateHistoryMigrationOptions) {
  return async (knex: Knex) => {
    await knex.schema.raw(`
        CREATE INDEX IF NOT EXISTS ${tableName}_sys_period ON ${tableName}(sys_period)
    `);
    await knex.schema.raw(`CREATE TABLE ${tableName}_history OF ${typeName}`);
    await knex.schema.raw(`
        CREATE TRIGGER versioning_trigger
          BEFORE INSERT OR UPDATE OR DELETE ON ${tableName}
          FOR EACH ROW EXECUTE PROCEDURE versioning(
            'sys_period', '${tableName}_history', true
          )
      `);
    await knex.schema.raw(`
        CREATE INDEX ${tableName}_history_sys_period ON ${tableName}_history(sys_period)
  `);
  };
}

function createHistoryMigrationDown({
  tableName,
}: CreateHistoryMigrationOptions) {
  return async (knex: Knex) => {
    await knex.schema.raw(`DROP TRIGGER versioning_trigger ON ${tableName}`);
    await knex.schema.raw(`DROP TABLE ${tableName}_history`);
    await knex.schema.raw(`DROP INDEX IF EXISTS ${tableName}_sys_period`);
  };
}
