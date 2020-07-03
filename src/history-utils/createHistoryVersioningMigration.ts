import fs from "fs";
import Knex from "knex";

function up(knex: Knex) {
  const sql = fs.readFileSync(
    `${__dirname}/createHistoryVersioningMigration.sql`,
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
