# Project knowledge

Status: **verified**

## Compose

Files: docker-compose.yml

| service | image | db | ports | healthcheck |
|---|---|---|---|---|
| api | (build) | - | 4000:4000 | false |
| mailpit | axllent/mailpit:v1.21 | - | 8025:8025, 1025:1025 | false |
| notifier | (build) | - |  | false |
| postgres | postgres:16-alpine | postgres 16 | 5432:5432 | true |
| redis | redis:7-alpine | redis 7 | 6379:6379 | false |
| web | (build) | - | 5173:5173 | false |

## Package manager

- Manager: npm (package-lock.json)

## Scripts

- **migrate** (db:migrate, package.json): `node src/migrate.js`
- **seed** (db:seed, package.json): `node src/seed.js`
- **dev** (dev:api, package.json): `node --watch src/api.js`
- **dev** (dev:web, package.json): `node --watch src/web.js`

## What prepare would refuse or rewrite

- [rewrite] volumes.pgdata: volumes.pgdata: renamed to sf-learn_pgdata so concurrent stacks don't collide
- [rewrite] networks.default: networks.default: renamed to sf-learn_default so concurrent stacks don't collide
- [rewrite] services.redis.ports[0]: services.redis: published port stripped so Docker assigns a random host port
- [rewrite] services.web: services.web: image renamed to sf-learn-web:dev for the isolated build
- [rewrite] services.web.ports[0]: services.web: published port stripped so Docker assigns a random host port
- [rewrite] services.api: services.api: image renamed to sf-learn-api:dev for the isolated build
- [rewrite] services.api.ports[0]: services.api: published port stripped so Docker assigns a random host port
- [rewrite] services.mailpit.ports[0]: services.mailpit: published port stripped so Docker assigns a random host port
- [rewrite] services.mailpit.ports[1]: services.mailpit: published port stripped so Docker assigns a random host port
- [rewrite] services.notifier: services.notifier: image renamed to sf-learn-notifier:dev for the isolated build
- [rewrite] services.postgres.ports[0]: services.postgres: published port stripped so Docker assigns a random host port

## Startup plan

Status: recorded

- prepare · prepare · -f docker-compose.yml
- up · compose-up · 
- migrate · exec · [container] api: node src/migrate.js (once schema)
- seed · exec · [container] api: node src/seed.js (once data)
- install-host · exec · [hybrid] npm ci --no-audit --no-fund (once deps)
- migrate-host · exec · [hybrid] node src/migrate.js (once schema)
- seed-host · exec · [hybrid] node src/seed.js (once data)
- api · host · [hybrid] node --watch src/api.js
- web · host · [hybrid] env API_URL={{api.url}} node --watch src/web.js

## Entry and links

- App: web:5173
- Mailpit: mailpit:8025
- Stack JSON: /api/stack (on the entry)

## How code changes reach the app

- api: rebuild hybrid mode: node --watch restarts on save
- notifier: rebuild (proposed) [Dockerfile:3]
- web: hot hybrid: index.html is read on every request; container: rebuild

## Secrets (names only)

- NOTIFY_API_TOKEN: Token for the notification service (any random string works for the demo)

## Answers

- Q: Where do migrations and seed run?
  A: On the host, with the instance's DATABASE_URL: npm ci once per checkout, node src/migrate.js on every start (idempotent), node src/seed.js only when the data volume is new.

## Verified

- Date: 2026-11-10
- Checks: database identity per worktree, won deal emailed by the notifier, hybrid api and web on the host against the isolated database
- Confirmation: "yes, the plan starts the CRM in container and hybrid mode"

