module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["./tsconfig.json"],
  },
  extends: [require.resolve("@ailo/eslint-config/configs/ts-node")],
};
