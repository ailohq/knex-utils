import {
  Monitoring,
  Severity,
  TransactionChild,
  TransactionStatus,
} from "@ailo/monitoring";
import { BaseKnex } from "./BaseKnex";

export function addMonitoringToKnex({
  knex,
  monitoring,
}: {
  knex: BaseKnex;
  monitoring: Monitoring;
}): void {
  const sentryTransactionsByKnexQueryUid: {
    [key: string]: TransactionChild | undefined;
  } = {};

  knex.on(
    "query",
    (obj: {
      __knexUid: string;
      __knexQueryUid: string;
      __knexTxId?: string;
      sql: string;
    }) => {
      const sentryTx = monitoring.startTransactionChild({
        op: "knex.query",
        description: obj.sql,
        tags: {
          ...(obj.__knexTxId ? { knexTxId: obj.__knexTxId } : {}),
        },
      });
      sentryTransactionsByKnexQueryUid[obj.__knexQueryUid] = sentryTx;
    }
  );

  knex.on(
    "query-error",
    (
      error: Error,
      obj: {
        __knexUid: string;
        __knexQueryUid: string;
        sql: string;
      }
    ) => {
      const sentryTx = sentryTransactionsByKnexQueryUid[obj.__knexQueryUid];
      if (sentryTx) {
        sentryTx.setData("error_name", error.name);
        sentryTx.setData("error_message", error.message);
        sentryTx.setStatus(TransactionStatus.InternalError);
        sentryTx.finish();
        delete sentryTransactionsByKnexQueryUid[obj.__knexQueryUid];
      }

      monitoring.addBreadcrumb({
        category: "knex.query_error",
        message: `Error: ${error}; Query: ${obj.sql}`,
        level: Severity.Info,
      });
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
      const sentryTx = sentryTransactionsByKnexQueryUid[obj.__knexQueryUid];
      if (sentryTx) {
        sentryTx.setStatus(TransactionStatus.Ok);
        sentryTx.finish();
        delete sentryTransactionsByKnexQueryUid[obj.__knexQueryUid];
      }

      monitoring.addBreadcrumb({
        category: "knex.query",
        message: obj.sql,
        level: Severity.Info,
      });
    }
  );
}
