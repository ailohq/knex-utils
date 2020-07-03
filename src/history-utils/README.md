# History Table utils

In Ailo, ideally we want to keep track of all changes in our database in all of our Node.js knex-based services.

For now, we decided to do it by having a separate "history table", that is basically a duplicate of a original table, but with its' rows being never deleted. Whenever a row is added/modified/removed from the table, it is added to the history table as a new row.

Such historical data is especially useful when we get support requests to give more context on what has happened. Of course, that’s not the only use case on why historical data is important.

## Adding a history table

### 1. Create Postgres `versioning` function

This function will auto-track any changes from the original table and record the changes in the history table.

##### Note: this migration must be done exactly once. It must be executed before any history table is created.

To do it, create a new knex migration file with the following content:

```js
module.exports = require("@ailo/knex-utils").createHistoryVersioningMigration();
```

### 2. Create history table

The history table will be linked to your existing ("original") table. Any changes made to the data of the original table will be tracked as data in the history table.

This requires the original table to be created using a [PostgreSQL Type](https://www.postgresql.org/docs/9.6/sql-createtype.html) in order to keep the schema of the original table and history table in sync.

#### Creating an original table and history table at once

Let's say you want to create a table for `cars`, named as `car`.

1. Create a migration file `20200611163000_create_car.up.sql`:

   ```sql
   create type car as (
       id uuid,
       name varchar(255),
       created_at timestamp,
       created_by ailorn,
       sys_period tstzrange
   );

   create table car_table of car (
       id primary key DEFAULT uuid_generate_v4(),
       name not null,
       created_at not null DEFAULT now(),
       created_by not null,
       sys_period NOT NULL DEFAULT tstzrange(current_timestamp, null)
   );
   ```

2. Create a migration file `20200611163000_create_car.down.sql` for `migration:down`:

   ```sql
   DROP TABLE car_table;
   DROP TYPE car
   ```

3. Create a migration file `20200611163000_test_car.js` to hook up both up and down sql files:

   ```js
   const carMigration = require("knex-migrate-sql-file")();
   const { createHistoryMigration } = require("@ailo/knex-utils");
   const carHistoryMigration = createHistoryMigration({
     tableName: "car_table",
     typeName: "car",
   });

   exports.up = async function (knex) {
     await carMigration.up(knex);
     await carHistoryMigration.up(knex);
   };

   exports.down = async function (knex) {
     await carHistoryMigration.down(knex);
     await carMigration.down(knex);
   };
   ```

#### Creating a history table for an existing table - Approach no 1 (using two migrations)

First, create a migration to change the existing table to use [PostgreSQL Type](https://www.postgresql.org/docs/9.6/sql-createtype.html).

##### Important: Ensure the schema of the type matches the existing table schema.

Assuming that a `car_table` already exists:

1. Create `20200611163000_car_type.up.sql` for `migration:up`:

   ```sql
   create type car as (
       id uuid,
       name varchar(255),
       created_at timestamp,
       created_by ailorn,
       sys_period tstzrange
   );

   ALTER TABLE car_table ADD COLUMN IF NOT EXISTS sys_period tstzrange NOT NULL DEFAULT tstzrange(current_timestamp, null);
   ALTER TABLE car_table OF car;
   ```

2. Create `20200611163000_car_type.down.sql` for `migration:down`:

   ```sql
   ALTER TABLE car_table NOT OF;
   ALTER TABLE car_table DROP COLUMN IF EXISTS sys_period;
   DROP TYPE car;
   ```

3. Create `20200611163000_car_type.js` to hook up both up and down sql files, to create the `car` type:

   ```js
   module.exports = require("knex-migrate-sql-file")();
   ```

Then, create the `car_table_history` table:

4. Create `20200611163001_car_history.js`:

   ```js
   module.exports = require("@ailo/knex-utils").createHistoryMigration({
     tableName: "car_table",
     typeName: "car",
   });
   ```

#### Creating a history table for an existing table - Approach no 2 (using one migration)

1. Create `20200611163000_car_history.up.sql` for `migration:up`:

   ```sql
   create type car as (
       id uuid,
       name varchar(255),
       created_at timestamp,
       created_by ailorn,
       sys_period tstzrange
   );

   ALTER TABLE car_table ADD COLUMN IF NOT EXISTS sys_period tstzrange NOT NULL DEFAULT tstzrange(current_timestamp, null);
   ALTER TABLE car_table OF car;
   ```

2. Create `20200611163000_car_history.down.sql` for `migration:down`:

   ```sql
   ALTER TABLE car_table NOT OF;
   ALTER TABLE car_table DROP COLUMN IF EXISTS sys_period;
   DROP TYPE car;
   ```

3. Create `20200611163000_car_history.js` to hook up both up and down sql files:

   ```js
   const sqlMigration = require("knex-migrate-sql-file")();
   const createHistoryMigration = require("@ailo/knex-utils");
   const carMigration = createHistoryMigration({
     tableName: "car_table",
     typeName: "car",
   });

   exports.up = async function (knex) {
     await sqlMigration.up(knex);
     await carMigration.up(knex);
   };

   exports.down = async function (knex) {
     await carMigration.down(knex);
     await sqlMigration.down(knex);
   };
   ```

### Adding a column to history-connected tables

Create a migration file `20200612163000_alter_car_add_fairy.js`:

```js
exports.up = async function (knex) {
  await knex.schema.raw(`
    ALTER TYPE car ADD ATTRIBUTE color text CASCADE;
  `);
  await knex.schema.raw(`
    ALTER TABLE car_table ALTER COLUMN color SET NOT NULL;
  `);
};

exports.down = async function (knex) {
  await knex.schema.raw(`
    ALTER TYPE car DROP ATTRIBUTE color CASCADE;
  `);
};
```

### Removing a column from history-connected tables

Create a migration file `20200613163000_alter_car_drop_test.js`:

```js
exports.up = async function (knex) {
  await knex.schema.raw(`
    ALTER TYPE car DROP ATTRIBUTE created_by CASCADE;
  `);
};

exports.down = async function (knex) {
  await knex.schema.raw(`
    ALTER TYPE car ADD ATTRIBUTE created_by ailorn CASCADE;
  `);
  await knex.schema.raw(`
    ALTER TABLE car_table ALTER COLUMN created_by SET NOT NULL;
  `);
};
```
