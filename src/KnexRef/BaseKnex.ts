// We use this instead of `Knex` so that the project depending on `@ailo/knex-utils`
// can use Knex with different version [and type definitions] than this project.
export type BaseKnex = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string | symbol, listener: (...args: any[]) => void): unknown;
};
