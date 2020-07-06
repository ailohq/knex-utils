import fs from "fs";
import path from "path";
import Knex from "knex";

function up(knex: Knex) {
  const sql = fs.readFileSync(
    path.resolve(
      __dirname,
      "../../assets/createHistoryVersioningMigration.sql"
    ),
    "utf8"
  );
  return knex.schema.raw(sql);
}

function down(knex: Knex) {
  return knex.schema.raw("DROP FUNCTION versioning;");
}

export function createHistoryVersioningMigration() {
  return {
    up,
    down,
  };
}
