import { BaseKnex } from "./BaseKnex";

export interface Logger {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  debug(...data: any[]): void;
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

export interface LoggerOptions {
  /**
   * Will skip logging queries that contain at least one of the given strings.
   *
   * @default ["command_journal", "event_journal", "incoming_message_journal"]
   */
  skipQueriesContaining?: string[];
}

export function addLoggerToKnex({
  knex,
  logger,
  loggerOptions: {
    skipQueriesContaining = [
      "command_journal",
      "event_journal",
      "incoming_message_journal",
    ],
  } = {},
}: {
  knex: BaseKnex;
  logger: Logger;
  loggerOptions?: LoggerOptions;
}): void {
  const metadataByKnexQueryUid: {
    [key: string]:
      | {
          startTimestamp: number;
        }
      | undefined;
  } = {};

  knex.on(
    "query",
    (obj: {
      __knexUid: string;
      __knexQueryUid: string;
      __knexTxId?: string;
      sql: string;
    }) => {
      // eslint-disable-next-line no-param-reassign
      metadataByKnexQueryUid[obj.__knexQueryUid] = {
        startTimestamp: Date.now(),
      };
    }
  );

  knex.on(
    "query-error",
    (
      _error: Error,
      obj: {
        __knexUid: string;
        __knexQueryUid: string;
        sql: string;
      }
    ) => {
      const metadata = metadataByKnexQueryUid[obj.__knexQueryUid];
      if (metadata) {
        if (
          !skipQueriesContaining.find((substring) =>
            obj.sql.includes(substring)
          )
        ) {
          const duration = Date.now() - metadata.startTimestamp;
          logger.debug(`QUERY ERROR (${duration} ms): ${obj.sql}`);
        }
        delete metadataByKnexQueryUid[obj.__knexQueryUid];
      }
    }
  );

  knex.on(
    "query-response",
    (
      _response,
      obj: {
        __knexUid: string;
        __knexQueryUid: string;
        sql: string;
      }
    ) => {
      const metadata = metadataByKnexQueryUid[obj.__knexQueryUid];
      if (metadata) {
        if (
          !skipQueriesContaining.find((substring) =>
            obj.sql.includes(substring)
          )
        ) {
          const duration = Date.now() - metadata.startTimestamp;
          logger.debug(`QUERY SUCCESS (${duration} ms): ${obj.sql}`);
        }
        delete metadataByKnexQueryUid[obj.__knexQueryUid];
      }
    }
  );
}
