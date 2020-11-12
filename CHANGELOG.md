# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.9.0](https://github.com/ailohq/knex-utils/compare/v1.7.0...v1.9.0) (2020-11-12)


### Features

* **KnexRef:** Skip logging @ailo/events sql queries by default ([6fd269a](https://github.com/ailohq/knex-utils/commit/6fd269a1db69804ff9ebd4638b69962024bb1b11))


### Bug Fixes

* **ailorn-utils:** Add backslashes to ailorn domain check ([a145c25](https://github.com/ailohq/knex-utils/commit/a145c254b8751b73b7283f8c4ede0af273f81669))

## [1.8.0](https://github.com/ailohq/knex-utils/compare/v1.5.5...v1.8.0) (2020-10-02)


### Features

* Add `CreateAilornColumnTypeMigration` ([84ca251](https://github.com/ailohq/knex-utils/commit/84ca2512cc1fc2c2fc1bc43d231f632ab4bfca8f))


### Bug Fixes

* **ailorn-utils:** Add backslashes to ailorn domain check ([a145c25](https://github.com/ailohq/knex-utils/commit/a145c254b8751b73b7283f8c4ede0af273f81669))
* Change sql log level from info to debug ([e9b03ac](https://github.com/ailohq/knex-utils/commit/e9b03ac7aef77ea0b0c25f63ed55d90c8ef3a20e))

## [1.7.0](https://github.com/ailohq/knex-utils/compare/v1.5.5...v1.7.0) (2020-09-25)


### Features

* Add `CreateAilornColumnTypeMigration` ([84ca251](https://github.com/ailohq/knex-utils/commit/84ca2512cc1fc2c2fc1bc43d231f632ab4bfca8f))


### Bug Fixes

* Change sql log level from info to debug ([e9b03ac](https://github.com/ailohq/knex-utils/commit/e9b03ac7aef77ea0b0c25f63ed55d90c8ef3a20e))

## [1.6.0](https://github.com/ailohq/knex-utils/compare/v1.5.5...v1.6.0) (2020-09-22)


### Features

* Add `CreateAilornColumnTypeMigration` ([f5bc35e](https://github.com/ailohq/knex-utils/commit/f5bc35ec5eec7ebccfb4df0e3cbe2e8e11294a53))

### [1.5.5](https://github.com/ailohq/knex-utils/compare/v1.5.4...v1.5.5) (2020-09-02)


### Bug Fixes

* Bump @ailo/monitoring version ([bbf4144](https://github.com/ailohq/knex-utils/commit/bbf41440b9210fae55748ff88f811c45d0ca51b6))

### [1.5.4](https://github.com/ailohq/knex-utils/compare/v1.5.3...v1.5.4) (2020-08-20)


### Bug Fixes

* **KnexRef:** Do not set logger by default ([e762599](https://github.com/ailohq/knex-utils/commit/e7625994ef6b877ff49be3c396733f7742114525))

### [1.5.3](https://github.com/ailohq/knex-utils/compare/v1.5.2...v1.5.3) (2020-08-20)


### Bug Fixes

* Move `@ailo/monitoring` to be a dep, not a peer dep; because the library typedefs rely on monitoring typedefs (even though its an optional dependency anyway ;/) ([40bb77c](https://github.com/ailohq/knex-utils/commit/40bb77cbdc76350852e9157246f78f9ca775fc37))

### [1.5.2](https://github.com/ailohq/knex-utils/compare/v1.5.1...v1.5.2) (2020-08-20)


### Bug Fixes

* Add missing port to ConnectionConfig typedef (https://github.com/knex/knex/pull/3372) ([143404e](https://github.com/ailohq/knex-utils/commit/143404e1df387adad99c8c3d043d255c5d8456f1))

### [1.5.1](https://github.com/ailohq/knex-utils/compare/v1.5.0...v1.5.1) (2020-08-20)


### Bug Fixes

* Make `@ailo/monitoring` dependency optional ([1340cc9](https://github.com/ailohq/knex-utils/commit/1340cc9192552440fc264a48e6603ab90f090940))

## [1.5.0](https://github.com/ailohq/knex-utils/compare/v1.4.1...v1.5.0) (2020-08-18)


### Features

* Add `KnexRef` class with logging and monitoring middlewares ([e0178af](https://github.com/ailohq/knex-utils/commit/e0178af89db40922c24d2b3675f11eb5395c8e1a))

### [1.4.1](https://github.com/ailohq/knex-utils/compare/v1.4.0...v1.4.1) (2020-07-06)


### Bug Fixes

* Make `createHistoryVersioningMigration.sql` file be correctly present in the build package ([22a94f8](https://github.com/ailohq/knex-utils/commit/22a94f829877118127c0723d5197347ac5280c73))

## [1.4.0](https://github.com/ailohq/knex-utils/compare/v1.3.0...v1.4.0) (2020-07-03)


### Features

* Export all test-utils in the main index.ts file ([f9a55bf](https://github.com/ailohq/knex-utils/commit/f9a55bf206f83f3504adbf97c228ee5964d5b3f7))
* Update docs on migration utils; move them to src directory; export them in the main index file ([58f7833](https://github.com/ailohq/knex-utils/commit/58f783346a50c7d44e72831bbd0c6a9e8dd135a3))

## [1.3.0](https://github.com/ailohq/ailo-knex-utils/compare/v1.2.1...v1.3.0) (2020-07-03)


### Features

* **AILO-3171:** Extract migration scripts to create history table with some improvements to make `type` a required parameter ([02c41f4](https://github.com/ailohq/ailo-knex-utils/commit/02c41f46656d94a7291f2866c7c25477b81f75e4))

### [1.2.1](https://github.com/ailohq/ailo-knex-utils/compare/v1.2.0...v1.2.1) (2020-07-01)


### Bug Fixes

* Make `local-db` use `mktemp` to generate a tmp/local-db-exec file ([d52df98](https://github.com/ailohq/ailo-knex-utils/commit/d52df981bc4675476582db34388652d075cc069e))

## [1.2.0](https://github.com/ailohq/ailo-knex-utils/compare/v1.1.0...v1.2.0) (2020-06-30)


### Features

* Add `useSeparateDatabase` option to useKnex helper ([cb5f977](https://github.com/ailohq/ailo-knex-utils/commit/cb5f977385001eca8146fa8836c0e25034d8956f))

## [1.1.0](https://github.com/ailohq/ailo-knex-utils/compare/v1.0.8...v1.1.0) (2020-06-30)


### Features

* Add `local-db` bin file ([30b0722](https://github.com/ailohq/ailo-knex-utils/commit/30b0722180c35e723d75bf8985ac5fcf0c75c710))

### [1.0.8](https://github.com/ailohq/ailo-knex-utils/compare/v1.0.7...v1.0.8) (2020-06-30)


### Bug Fixes

* Correctly build files when version is released ([5150aa0](https://github.com/ailohq/ailo-knex-utils/commit/5150aa0518893901b1b6de45b4a73009fd511d2d))
* Do not ask for version when releasing as it is automatically generated by standard-version ([94a656b](https://github.com/ailohq/ailo-knex-utils/commit/94a656bab028ab97c5dec8c64fa1b4442788dbfd))

### [1.0.7](https://github.com/ailohq/ailo-knex-utils/compare/v1.0.6...v1.0.7) (2020-06-30)

### Bug Fixes

- **useKnex:** Recreate db on each run by default if migrateTo param is present ([b6acb6f](https://github.com/ailohq/ailo-knex-utils/commit/b6acb6fab0123476f282ebe647b308cd18e7bc7b))

### [1.0.6](https://github.com/ailohq/ailo-knex-utils/compare/v1.0.5...v1.0.6) (2020-06-29)

### [1.0.5](https://github.com/ailohq/ailo-knex-utils/compare/v1.0.4...v1.0.5) (2020-06-29)

### [1.0.4](https://github.com/ailohq/ailo-knex-utils/compare/v1.0.2...v1.0.4) (2020-06-29)

### 1.0.2 (2020-06-29)
