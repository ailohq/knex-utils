import Knex from "knex";

export interface CreateRenameTableMigrationOptions {
  oldTableName: string;
  oldTypeName: string;
  newTableName: string;
  newTypeName: string;
  /**
   * @default "public"
   */
  schema?: string;
}

export function createRenameTableMigration(
  options: CreateRenameTableMigrationOptions
): Knex.Migration {
  return {
    up: createRenameTableMigrationUp(options),
    down: createRenameTableMigrationDown(options),
  };
}

function createRenameTableMigrationUp({
  oldTableName,
  oldTypeName,
  newTableName,
  newTypeName,
  schema = "public",
}: CreateRenameTableMigrationOptions) {
  return async (knex: Knex) => {
    await knex.schema.raw(`
      ALTER TYPE ${schema}.${oldTypeName} RENAME TO ${newTypeName}
    `);
    await knex.schema.raw(`
      ALTER TABLE ${schema}.${oldTableName} RENAME TO ${newTableName}
    `);
    await knex.schema.raw(`
      ALTER INDEX ${oldTableName}_sys_period RENAME TO ${newTableName}_sys_period
    `);
    await knex.schema.raw(`
      ALTER TABLE ${schema}.${oldTableName}_history RENAME TO ${newTableName}_history
    `);

    await knex.schema.raw(`
      DROP TRIGGER versioning_trigger ON ${schema}.${newTableName};
      CREATE TRIGGER versioning_trigger
        BEFORE INSERT OR UPDATE OR DELETE ON ${schema}.${newTableName}
        FOR EACH ROW EXECUTE PROCEDURE versioning(
          'sys_period', '${schema}.${newTableName}_history', true
        );
    `);
    await knex.schema.raw(`
      ALTER INDEX ${oldTableName}_history_sys_period RENAME TO ${newTableName}_history_sys_period 
    `);
  };
}

function createRenameTableMigrationDown({
  oldTableName,
  oldTypeName,
  newTableName,
  newTypeName,
  schema = "public",
}: CreateRenameTableMigrationOptions) {
  return createRenameTableMigrationUp({
    newTableName: oldTableName,
    newTypeName: oldTypeName,
    oldTableName: newTableName,
    oldTypeName: newTypeName,
    schema,
  });
}
