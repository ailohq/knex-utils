import Knex, { ConnectionConfig } from "knex";
import knexMigrate from "knex-migrate";
import { clearDatabase, ClearDatabaseConfig } from "./clearDatabase";
import { truncateDatabase, TruncateDatabaseConfig } from "./truncateDatabase";
import { createKnexChildDatabase } from "./createKnexChildDatabase";

export interface UseKnexConfig {
  knexConfig: Omit<Knex.Config, "connection"> & {
    connection: ConnectionConfig;
  };

  /**
   * If true, we won't be running tests directly in the database supplied in the `knexConfig`,
   * but instead create a separate database for all test runs in this file (in the `beforeAll`).
   *
   * This needs to be enabled if your tests are being run in parallel
   * (that is, without the `--runInBand` jest parameter).
   *
   * By default true.
   */
  useSeparateDatabase?: boolean;

  /**
   * Optionally, pass a version ID (like "20200521164132"), to migrate only to specific db version.
   * Useful for testing db migrations
   * (migrate to previous one, and run your own's migration `up` manually in order to test it.)
   */
  migrateTo?: string | number;

  /**
   * If `before-all`, database migrations are run only once (in `beforeAll` callback).
   * If `before-each`, database migrations are run before each test run (in `beforeEach` callback).
   *
   * By default: `migrateTo ? 'before-each' : 'before-all'`.
   */
  migrateOn?: "before-each" | "before-all";

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
 * const knexRef = useKnex({
 *   migrateTo: "20200521164132"
 * });
 *
 * describe("database/migrations/20200525113218_my_new_migration", () => {
 *   describe("up", () => {
 *     it("adds example name to existing users", async () => {
 *       let user = await givenAUser();
 *       expect(user.name).toBeUndefined();
 *
 *       await up(knexRef.current);
 *
 *       user = await User.query().findById(user.id);
 *       expect(user.name).toEqual("example-name");
 *     });
 *   });
 * });
 * ```
 */
export function useKnex({
  knexConfig: hostKnexConfig,
  useSeparateDatabase = true,
  migrateTo,
  migrateOn = migrateTo ? "before-each" : "before-all",
  clearConfig,
  truncateConfig,
}: UseKnexConfig) {
  const runsOnLatestMigration = !migrateTo;

  let knex: Knex;
  let knexConfig: UseKnexConfig["knexConfig"];

  beforeAll(async () => {
    const nextKnexRef = useSeparateDatabase
      ? await createKnexChildDatabase({
          knexConfig: hostKnexConfig,
        })
      : { knex: Knex(hostKnexConfig), knexConfig: hostKnexConfig };
    knex = nextKnexRef.knex;
    knexConfig = nextKnexRef.knexConfig;
  });

  if (migrateOn === "before-all") {
    beforeAll(async () => {
      if (runsOnLatestMigration) {
        await knex.migrate.latest();
      } else {
        if (!useSeparateDatabase) {
          await clearDatabase(knex, clearConfig);
        }
        await knexMigrate("up", { config: knexConfig, to: migrateTo });
      }
    });

    beforeEach(async () => {
      await truncateDatabase(knex, {
        ...truncateConfig,
        keepMigrations: true,
      });
    });

    afterAll(async () => {
      if (!runsOnLatestMigration) {
        await clearDatabase(knex, clearConfig);
      }
    });
  } else {
    beforeEach(async () => {
      await clearDatabase(knex, clearConfig);
      if (runsOnLatestMigration) {
        await knex.migrate.latest();
      } else {
        await knexMigrate("up", { config: knexConfig, to: migrateTo });
      }
    });
  }

  afterAll(async () => {
    // Not sure if we should call it as it might impact other unit tests?
    // Remove it, if it causes problems.
    await knex.destroy();
  });

  return {
    get current() {
      return knex;
    },
  };
}
