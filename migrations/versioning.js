const fs = require("fs");

const sql = fs.readFileSync(__dirname + "/versioning.sql", "utf8");

function up(knex) {
  return knex.schema.raw(sql);
}

function down(knex) {
  return knex.schema.raw("DROP FUNCTION versioning;");
}

module.exports = {
  up: up,
  down: down,
};
