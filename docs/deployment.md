# Deployment Notes

Auto is a Next.js app inside a pnpm workspace. The easiest first deployment target
is Vercel.

## Vercel Setup

1. Import the Git repository in Vercel.
2. Select `apps/web` as the project root directory for the web app.
3. Add the required environment variables for Production and Preview:
   - `OPENAI_API_KEY`
   - `EMBEDDING_MODEL`
   - `RANKER_MODEL`
   - `ADMIN_TOKEN`
4. Choose a feedback storage mode:
   - Local development: `FEEDBACK_STORE=file`
   - Deployed/serverless: `FEEDBACK_STORE=webhook`
5. If using webhook feedback, also add:
   - `FEEDBACK_WEBHOOK_URL`
   - `FEEDBACK_WEBHOOK_SECRET` if your receiver expects a bearer token
6. Open `/admin/login` after deployment and sign in with `ADMIN_TOKEN` to view
   local feedback. Do not put the token in the URL.

Vercel references:
- Monorepos and root directories: https://vercel.com/docs/monorepos
- Environment variables: https://vercel.com/docs/environment-variables

## Why Feedback Needs A Production Store

Local feedback is written to `data/feedback.jsonl`, which is useful during
development. A serverless deployment should not rely on local file writes for
durable product data. Use `FEEDBACK_STORE=webhook` for the first deployed version,
then replace it with a database-backed store when Auto needs real analytics.

## Admin Access

`/admin/feedback` is protected by an httpOnly cookie when `ADMIN_TOKEN` is set.
The login flow is:

1. Open `/admin/login`.
2. Enter the value of `ADMIN_TOKEN`.
3. The app stores a short-lived admin cookie and redirects to `/admin/feedback`.

If `ADMIN_TOKEN` is missing, the admin login page shows a setup warning.

## Pre-Deploy Checklist

Run these before creating a production deployment:

```bash
pnpm --filter @auto/core test
pnpm --filter @auto/web typecheck
pnpm --filter @auto/web build
```

Then verify:

```bash
curl http://localhost:3000/api/v1/health
curl -X POST http://localhost:3000/api/v1/feedback \
  -H "Content-Type: application/json" \
  -d '{"query":"test","rating":"good_match","primaryToolId":"elicit"}'
```
