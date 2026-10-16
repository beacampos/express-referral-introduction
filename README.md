# Referral Introduction

Submit a requested introduction between consenting participants. This small application demonstrates **Server-side template composition** with Express.

## What it does

Introduce two people who have agreed to be connected. Each receives the same context and contact details.

The email workflow: send the introduction with supplied context.

## Technologies

- Express
- EJS
- native fetch
- Node.js 24 and its built-in SQLite module for local persistence
- Zod for input validation
- Mailtrap for email delivery

## Run locally

Install Node.js 24 or newer in the 24.x release line and npm. The built-in SQLite API is experimental in some Node 24 releases; no database server or native build tools are required.

```sh
npm ci
cp .env.example .env
# Edit .env: set ADMIN_PASSWORD, APP_URL,
# and email credentials using docs/email-setup.md.
npm run dev
```

Open the browser at the exact `APP_URL` origin (default http://localhost:3000). For operator access, choose a unique password of at least 16 characters. You can generate one with:

```sh
node -e "console.log(require('node:crypto').randomBytes(24).toString('base64url'))"
```

Use that value in `.env`; the operator username is `admin`. See [email configuration](docs/email-setup.md) for the default provider, development setup, and production settings. To explore locally without credentials, set `MAIL_MODE=log` while running `npm run dev`; resulting messages are written to `.data/emails.jsonl` and are **not sent**. Log mode is disabled when `NODE_ENV=production`.

## Try the workflow

1. Open http://localhost:3000 after starting the application.
2. Sign in with username `admin` and the `ADMIN_PASSWORD` you configured.
3. Complete the form with realistic sample values and submit.
4. Check `/admin` for the saved record and email state.

Example form values:

```json
{
  "name": "Alex Doe",
  "email": "alex@example.com",
  "second_name": "Sam Lee",
  "second_email": "sam@example.com",
  "message": "You are both working on community projects.",
  "consent": "on"
}
```



## Configuration

| Variable | Meaning |
| --- | --- |
| `APP_URL` | Exact public origin; used for request URLs and cross-origin checks |
| `ADMIN_PASSWORD` | Operator password, at least 16 characters |
| `DB_PATH` | SQLite file; defaults to `.data/app.sqlite` |
| `HOST`, `PORT` | Production listener settings where supported by the framework |
| `MAIL_MODE` | `sandbox`, `production`, or local-only `log` |

Email credential variables are documented in [email setup](docs/email-setup.md). Frameworks must be restarted after environment changes. Customize the app's public copy, fields, seeded event details, or menu in `src/core/config.js`.

## Where the main idea lives

- `src/server.js` (routes and middleware) and `views/index.ejs` (page template).
- `src/core/service.js`: the application's workflow, field validation, and atomic state changes.
- `src/core/store.js`: SQLite records, rate counters, and a small email outbox.
- `src/core/mail.js`: server-side email transport and environment selection.
- `test/workflow.test.mjs`: workflow and permission edge cases.
- `test/email.test.mjs`: transport configuration tests using local doubles.

## Check and build

```sh
npm test
npm run build
npm start
```

Tests exercise the app's business rules and email configuration without sending external mail. They do not prove production delivery. To check actual sending, configure your own credentials and complete the normal workflow with an address you control.

## Email failures

Saving a valid record and recording its intended email happen in one SQLite transaction. Sending happens afterward. An email failure leaves the record intact and appears in the operator page.

```sh
npm run retry-email
```

This retries pending and known-failed messages. `accepted` means accepted by the provider, not confirmed delivery. `logged` means a local preview only. Timeouts or partial HTTP API results are `unknown`; messages interrupted by a process crash may remain `sending`. These states are not automatically retried because a first send may have succeeded. Check provider logs before reconciling them manually.

## Deployment and limits

Run one Node process behind HTTPS with a persistent writable volume for `DB_PATH`. Run the build first, then start with your configured environment. Set `APP_URL` to the real HTTPS origin; do not trust arbitrary forwarded headers. Behind a trusted proxy, `app.set('trust proxy', …)` controls Express proxy trust. The operator uses HTTP Basic authentication and must be protected by HTTPS outside localhost. This app is not designed for ephemeral or multi-instance serverless storage.

Form submissions are limited to 12 per client per hour and 3 per recipient per hour. Behind a reverse proxy, clients may share the proxy address; configure infrastructure limits before larger deployment. There is no multi-user operator system, payment processing, distributed job queue, or production email webhook tracker.

## License

MIT. See [LICENSE](LICENSE).
