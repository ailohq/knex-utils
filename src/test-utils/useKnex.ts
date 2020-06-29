import type Knex from "knex";
import knexMigrate from "knex-migrate";
import { clearDatabase, ClearDatabaseConfig } from "./clearDatabase";
import { truncateDatabase, TruncateDatabaseConfig } from "./truncateDatabase";

export interface UseKnexConfig {
  knex: Knex;
  knexConfig: Knex.Config;
  migrateTo?: string | number;
  clearConfig?: ClearDatabaseConfig;
  truncateConfig?: TruncateDatabaseConfig;
}

/**
 * Add `useKnex()` to your unit tests
 * if you want to make sure that the database is set
 * and migrated to latest version.
 *
 * @example
 * ```js
 * import { up } from "../20200525113218_my_new_migration";
 *
 * const knex = useKnex({
 *   migrateTo: "20200521164132"
 * });
 *
 * describe("database/migrations/20200525113218_my_new_migration", () => {
 *   describe("up", () => {
 *     it("adds example name to existing users", async () => {
 *       let user = await givenAUser();
 *       expect(user.name).toBeUndefined();
 *
 *       await knex.transaction(async trx => {
 *         await up(trx);
 *       });
 *
 *       user = await User.query().findById(user.id);
 *       expect(user.name).toEqual("example-name");
 *     });
 *   });
 * });
 * ```
 */
export function useKnex({
  knex,
  knexConfig,
  /**
   * Optionally, pass a version ID (like "20200521164132"), to migrate only to specific db version.
   * Useful for testing db migrations
   * (migrate to previous one, and run your own's migration `up` manually in order to test it.)
   */
  migrateTo,
  clearConfig,
  truncateConfig,
}: UseKnexConfig) {
  const runsOnLatestMigration = !migrateTo;

  beforeAll(async () => {
    if (runsOnLatestMigration) {
      // If we want to be running on the latest db version,
      // let's just make sure recent db migrations have been run
      await knex.migrate.latest();
    } else {
      // Otherwise clear the database and migrate it to specific db version
      await clearDatabase(knex, clearConfig);
      await knexMigrate("up", { config: knexConfig, to: migrateTo });
    }
  });

  beforeEach(async () => {
    await truncateDatabase(knex, { ...truncateConfig, keepMigrations: true });
  });

  afterAll(async () => {
    // If we haven't been running on the latest db version,
    // clear the database back to normal state after all tests
    if (!runsOnLatestMigration) {
      await clearDatabase(knex, clearConfig);
    }

    // Not sure if we should call it as it might impact other unit tests?
    // Remove it, if it causes problems.
    await knex.destroy();
  });

  return knex;
}
