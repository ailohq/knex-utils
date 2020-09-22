# @ailo/knex-utils

Utilities to be used in node.js repos using `knex`.

## Usage

First, add it as a dependency:

```sh
yarn add @ailo/knex-utils
```

Then, depending on what you need:

#### Knex singleton instance (`KnexRef`)

See [/src/KnexRef/KnexRef.ts](/src/KnexRef/KnexRef.ts).

#### Add `ailorn` column type to postgres

```js
// database/migrations/123_create_ailorn_column_type.js
const { CreateAilornColumnTypeMigration } = require("@ailo/knex-utils");
module.exports = CreateAilornColumnTypeMigration;
```

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

#### History Table DB migration utils

See [/src/history-utils/README.md](/src/history-utils/README.md).

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
