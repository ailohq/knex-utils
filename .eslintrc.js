const path = require("path");

module.exports = {
  extends: [require.resolve("@ailo/eslint-config/configs/ts-node")],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: path.resolve(__dirname, "./tsconfig.json"),
    // tsconfigRootDir: __dirname,
    // sourceType: "module",
    // include: [
    //   path.resolve(__dirname, "src/**/*.ts"),
    //   path.resolve(__dirname, "test_modules/**/*.ts")
    // ]
  },
};
