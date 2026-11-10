# Acme CRM

A small sales CRM for [stackfork](https://github.com/pedropinheiro75/stackfork) demos. It starts in two modes:

- **Container mode:** everything runs in Docker Compose.
- **Hybrid mode:** `api` and `web` run on your machine with `node --watch` (hot reload, a debugger). Postgres, Redis, Mailpit and the `notifier` stay in Docker. Each branch still gets its own copy of each.

| Service | Container mode | Hybrid mode |
|---|---|---|
| `web` (UI, proxies `/api`) | Docker | your machine |
| `api` (deals, contacts) | Docker | your machine |
| `notifier` (emails sales when a deal is won, needs `NOTIFY_API_TOKEN`) | Docker | Docker |
| `postgres`, `redis`, `mailpit` | Docker | Docker |

The UI shows where the api runs right now: a Docker container or your machine.

## Start it

You need Docker, Node 22 and stackfork.

1. Store the secret in your keychain (run once per machine):

   ```sh
   stackfork secret set acme-notify
   stackfork secret map . NOTIFY_API_TOKEN=keychain:acme-notify
   ```

2. Pick a mode for this repo:

   ```sh
   stackfork config set-mode "$PWD" hybrid
   ```

3. Read the host steps, then trust them (run once per machine; only a person can do this):

   ```sh
   stackfork plan --mode hybrid
   stackfork plan --trust
   ```

4. Start it:

   ```sh
   stackfork start-env
   stackfork urls
   ```

5. Move a deal to `won`. The notifier emails `sales@acme.test`. Open Mailpit to see it.

In hybrid mode the plan runs `npm ci`, the migrations and the seed on your machine, against this environment's own database. In container mode they run inside the `api` container.
