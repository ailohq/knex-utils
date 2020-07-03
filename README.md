# @ailo/knex-utils

Utilities to be used in node.js repos using `knex`.

## Usage

First, add it as a dependency:

```sh
yarn add @ailo/knex-utils
```

Then, depending on what you need:

#### Test Utils (e.g. `useKnex`)

```ts
// database/migrations/tests/1002_rename_user_to_person.test.ts
import { useKnex } from "@ailo/knex-utils/build/main/test-utils";
import { testMigrationConfig } from "knexConfig";
import moment from "moment";
import { up } from "../1002_rename_user_to_person";

const knexRef = useKnex({
  knexConfig: testMigrationConfig,
  migrateTo: "1001",
});

it("db migration 1002_rename_user_to_person works", async () => {
  const knex = knexRef.current;

  await knex("user").insert({
    name: "john",
  });
  await up(knex);

  const [user] = await knex("person").select("id", "name");
  expect(user.name).toEqual("john");
});
```

#### `local-db` shell file

```sh
yarn local-db
yarn local-db test
```

#### Database migrations scripts

##### How to add history table?

###### [versioning.js](./migrations/versioning.js)

Creates a PostgreSQL function that will auto-track any changes from the original table and record the changes in the history table. 

> Note: this migration must be done only once and must be executed before any history tables are created.

**Usage:**

Create a new migration file with the following: 

```js
module.exports = require("@ailo/knex-utils/migrations/versioning");
```

###### [createHistory.js](./migrations/createHistory.js)

Creates a history table that will be linked to an existing table. Any changes made to the original table will be tracked in the history table. This requires the original table to be created using [PostgreSQL Type](https://www.postgresql.org/docs/9.6/sql-createtype.html) in order to keep the schema of the original table and history table in sync.

**Examples:**

- To create a new table and a corresponding history table

  Create a migration file `20200611163000_test_foo.up.sql` for `migration:up`:

  ```sql
  create type foo as (
      id uuid,
      name varchar(255),
      agency_reference ailorn,
      created_at timestamp,
      created_by ailorn,
      sys_period tstzrange
  );

  create table foo_table of foo (
      id primary key DEFAULT uuid_generate_v4(),
      name not null,
      agency_reference not null,
      created_at not null DEFAULT now(),
      created_by not null,
      sys_period NOT NULL DEFAULT tstzrange(current_timestamp, null)
  );
  ```

  Create a migration file `20200611163000_test_foo.down.sql` for `migration:down`:

  ```sql
  DROP TABLE foo_table;
  DROP TYPE foo
  ```

  Create a migration file `20200611163000_test_foo.js` to hook up both up and down sql files:
  
  ```js
  const sqlMigration = require("knex-migrate-sql-file")();
  const createHistoryMigration = require("@ailo/knex-utils/migrations/createHistory");
  const fooMigration = createHistoryMigration("foo_table", "foo");

  exports.up = async function (knex) {
    await sqlMigration.up(knex, Promise.resolve(null));
    await fooMigration.up(knex);
  };

  exports.down = async function (knex) {
    await fooMigration.down(knex);
    await sqlMigration.down(knex, Promise.resolve(null));
  };
  ```

- To add a history table to an existing table
  
  **Approach 1:**

  1. Create a migration to change the existing table to use [PostgreSQL Type](https://www.postgresql.org/docs/9.6/sql-createtype.html). 
  
      > Important: Ensure the schema of the type matches the existing table schema.

      **Examples:**

      Assumption: `foo_table` already exists
  
      `20200611163000_foo_type.up.sql` for `migration:up`:

      ```sql
      create type foo as (
          id uuid,
          name varchar(255),
          agency_reference ailorn,
          created_at timestamp,
          created_by ailorn,
          sys_period tstzrange
      );

      ALTER TABLE foo_table ADD COLUMN IF NOT EXISTS sys_period tstzrange NOT NULL DEFAULT tstzrange(current_timestamp, null);
      ALTER TABLE foo_table OF foo;
      ```

      `20200611163000_foo_type.down.sql` for `migration:down`:

      ```sql
      ALTER TABLE foo_table NOT OF;
      ALTER TABLE foo_table DROP COLUMN IF EXISTS sys_period;
      DROP TYPE foo;
      ```

      `20200611163000_foo_type.js` to hook up both up and down sql files:
  
      ```js
      module.exports = require("knex-migrate-sql-file")();
      ```

  2. Create another migration to create the history table

     **Examples:**

      `20200611163001_foo_history.js` to create `foo_table_history` table:
  
      ```js
      module.exports = require("@ailo/knex-utils/migrations/createHistory")("foo_table", "foo");
      ```

  **Approach 2:**

  Merge the 2 steps in Approach 1 as a single migration:

  `20200611163000_foo_history.up.sql` for `migration:up`:

  ```sql
  create type foo as (
      id uuid,
      name varchar(255),
      agency_reference ailorn,
      created_at timestamp,
      created_by ailorn,
      sys_period tstzrange
  );

  ALTER TABLE foo_table ADD COLUMN IF NOT EXISTS sys_period tstzrange NOT NULL DEFAULT tstzrange(current_timestamp, null);
  ALTER TABLE foo_table OF foo;
  ```

  `20200611163000_foo_history.down.sql` for `migration:down`:

  ```sql
  ALTER TABLE foo_table NOT OF;
  ALTER TABLE foo_table DROP COLUMN IF EXISTS sys_period;
  DROP TYPE foo;
  ```

  `20200611163000_foo_history.js` to hook up both up and down sql files:

  ```js
  const sqlMigration = require("knex-migrate-sql-file")();
  const createHistoryMigration = require("@ailo/knex-utils/migrations/createHistory");
  const fooMigration = createHistoryMigration("foo_table", "foo");

  exports.up = async function (knex) {
    await sqlMigration.up(knex, Promise.resolve(null));
    await fooMigration.up(knex);
  };

  exports.down = async function (knex) {
    await fooMigration.down(knex);
    await sqlMigration.down(knex, Promise.resolve(null));
  };
  ```

- To add new column to existing table
  
  Create a migration file `20200612163000_alter_foo_add_fairy.js`:

  ```js
  exports.up = async function (knex) {
      await knex.schema.raw(`
          ALTER TYPE foo ADD ATTRIBUTE fairy text CASCADE;
      `);
      await knex.schema.raw(`
          ALTER TABLE foo_table ALTER COLUMN fairy SET NOT NULL;
      `);
  };

  exports.down = async function (knex) {
      await knex.schema.raw(`
          ALTER TYPE foo DROP ATTRIBUTE fairy CASCADE;
      `);
  };
  ```

- To delete an existing column from a table
  
  Create a migration file `20200613163000_alter_foo_drop_test.js`:

  ```js 
  exports.up = async function (knex) {
      await knex.schema.raw(`
          ALTER TYPE foo DROP ATTRIBUTE created_by CASCADE;
      `);
  };

  exports.down = async function (knex) {
      await knex.schema.raw(`
          ALTER TYPE foo ADD ATTRIBUTE created_by ailorn CASCADE;
      `);
      await knex.schema.raw(`
          ALTER TABLE foo_table ALTER COLUMN created_by SET NOT NULL;
      `);
  };
  ```

## Development

```sh
yarn
yarn start
```

## Testing

```sh
yarn lint # prettier and eslint
yarn test # unit tests
yarn test:watch # unit tests in watch mode
```

## Releasing

```sh
yarn release
```
