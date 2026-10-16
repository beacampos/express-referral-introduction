# Email configuration

Mailtrap is the default email service. Referral Introduction uses the HTTP Sending API. Credentials stay on the server; the repository contains no account credentials.

## Development and staging

Copy `.env.example` to `.env`. Keep `MAIL_MODE=sandbox`, set `MAIL_FROM`, `MAILTRAP_SANDBOX_TOKEN`, and numeric `MAILTRAP_INBOX_ID` from the Sandbox API integration page. The two participant messages use `https://sandbox.api.mailtrap.io/api/batch/{inbox_id}`; a single remaining message uses `/api/send/{inbox_id}`, and messages are captured in that Sandbox. Disable forwarding when external delivery is not intended.

## Production

Verify your sending domain, set `MAIL_MODE=production`, `MAIL_FROM` on that domain, and `MAILTRAP_PRODUCTION_TOKEN` with sending permission. The two participant messages use `https://send.api.mailtrap.io/api/batch`; a single remaining message uses `/api/send`. Both environments use Bearer authentication over HTTPS. Restart after changing configuration.

## Message details

Each content send includes a workflow `category`, plain text and escaped HTML. `custom_variables` carries the stored record ID and workflow for finding the message in provider logs; it does not render template text. `X-Workflow-Reference` supplies the same reference as a custom header. No extra recipients are added to an email for demonstration purposes.

## Previews and failures

`MAIL_MODE=log` with `npm run dev` writes private JSON previews to `.data/emails.jsonl`; it makes no network call and is disabled in production. Keep these files private because they can contain addresses and action links.

A provider acceptance response must contain `success: true` and a message ID for each recipient. Accepted means submitted to the provider, not delivered to the inbox. Missing credentials and explicit rejection remain visible as failed; correct configuration and run `npm run retry-email`. Timeouts, server errors, malformed replies, and interrupted sends stay unknown or sending. Inspect provider logs before deciding how to reconcile them; they are not resent automatically. Retries are operator initiated, including rate-limit rejections; wait for the provider's cooldown before retrying.

Reference: [Sending API](https://docs.mailtrap.io/developers), [official API schemas](https://github.com/mailtrap/mailtrap-openapi), [custom variables](https://docs.mailtrap.io/email-api-smtp/advanced/custom-variables).

Related pending messages are sent with `/api/batch` in groups of at most 20, with one private recipient per request. Each response is matched to its original outbox row; a rejected entry does not cause successful entries to be retried. Single remaining messages use `/api/send`.
