import type { Monitoring } from "@ailo/monitoring";
import Knex from "knex";
import { addLoggerToKnex, Logger } from "./addLoggerToKnex";
import { addMonitoringToKnex } from "./addMonitoringToKnex";
import { BaseKnex } from "./BaseKnex";

interface KnexRefOptions<K extends BaseKnex = Knex> {
  knex: K;

  /**
   * Used to trace SQL queries.
   *
   * Unused if `NODE_ENV` equals to `"test"`.
   */
  monitoring?: Monitoring;

  /**
   * Used to log SQL queries. Can be `console` or a winston logger instance.
   *
   * Unused if `NODE_ENV` equals to `"test"`.
   */
  logger?: Logger;

  /**
   * Pass this in if you need to do some additional work after your knex instance is reconfigured.
   *
   * @example
   * ```
   * onChange(knex: Knex) {
   *   Model.knex(knex);
   * }
   * ```
   */
  onChange?(knex: K): void;
}

/**
 * Use this to define a singleton reference to Knex instance used throughout your app.
 *
 * @example
 * ```ts
 * import Knex from "knex";
 * import { KnexRef } from "@ailo/knex-utils";
 * import { serverConfig } from "knexConfig";
 * import { Logger } from "local/app/utils/logger";
 * import { monitoring } from "local/app/utils/monitoring";
 * import { Model } from "./Model";
 *
 * export const knexRef = new KnexRef<Knex>({
 *   knex: Knex(serverConfig),
 *   monitoring,
 *   logger: Logger.logAs("knex"),
 *   onChange(knex: Knex) {
 *     Model.knex(knex);
 *   }
 * });
 * ```
 */
export class KnexRef<K extends BaseKnex = Knex> {
  private _knex!: K;

  private readonly monitoring?: Monitoring;

  private readonly logger?: Logger;

  private readonly onChange?: (knex: K) => void;

  constructor({ knex, monitoring, logger, onChange }: KnexRefOptions<K>) {
    this.monitoring = monitoring;
    this.logger = logger;
    this.onChange = onChange;
    this.current = knex;
  }

  get current(): K {
    return this._knex;
  }

  set current(knex: K) {
    this._knex = knex;

    if (process.env.NODE_ENV !== "test") {
      if (this.monitoring) {
        addMonitoringToKnex({ knex, monitoring: this.monitoring });
      }
      if (this.logger) {
        addLoggerToKnex({ knex, logger: this.logger });
      }
    }

    this.onChange?.(knex);
  }
}
