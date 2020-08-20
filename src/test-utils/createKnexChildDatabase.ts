import Knex, { PgConnectionConfig } from "knex";
// eslint-disable-next-line import/no-extraneous-dependencies
import { v4 as uuid } from "uuid";

export interface CreateKnexChildDatabaseConfig {
  knexConfig: Omit<Knex.Config, "connection"> & {
    connection: PgConnectionConfig;
  };
}

export async function createKnexChildDatabase({
  knexConfig: hostKnexConfig,
}: CreateKnexChildDatabaseConfig) {
  const childDatabaseName = `_${uuid().replace(/-/g, "_")}`;

  const hostKnexInstance = Knex(hostKnexConfig);
  await hostKnexInstance.raw(`CREATE DATABASE ${childDatabaseName}`);
  await hostKnexInstance.destroy();

  const childKnexConfig = {
    ...hostKnexConfig,
    connection: {
      ...hostKnexConfig.connection,
      database: childDatabaseName,
    },
  };
  const childKnexInstance = Knex(childKnexConfig);

  return {
    knex: childKnexInstance,
    knexConfig: childKnexConfig,
  };
}
