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
   - `INTENT_MODEL`
   - `PLANNER_MODEL`
   - `SESSION_SECRET`
   - `ADMIN_TOKEN`
4. Choose a deployment mode:
   - Self-hosted / single-user: `APP_MODE=local`
   - Hosted shared-key deployment: `APP_MODE=open`
5. Choose a feedback storage mode:
   - Local development: `FEEDBACK_STORE=file`
   - Deployed/serverless: `FEEDBACK_STORE=webhook`
6. If using webhook feedback, also add:
   - `FEEDBACK_WEBHOOK_URL`
   - `FEEDBACK_WEBHOOK_SECRET` if your receiver expects a bearer token
7. Open `/admin/login` after deployment and sign in with `ADMIN_TOKEN` to view
   local feedback. Do not put the token in the URL.

Vercel references:
- Monorepos and root directories: https://vercel.com/docs/monorepos
- Environment variables: https://vercel.com/docs/environment-variables

## Why Feedback Needs A Production Store

Local feedback is written to `data/feedback.jsonl`, which is useful during
development. A serverless deployment should not rely on local file writes for
durable product data. Use `FEEDBACK_STORE=webhook` for the first deployed version,
then replace it with a database-backed store when Auto needs real analytics.

## Hosted Open Mode

`APP_MODE=open` is for a public deployment that uses the server's shared
`OPENAI_API_KEY`. In this mode Auto fails closed unless credit metering is
configured, so a missing backend cannot silently expose the shared OpenAI budget.

1. Run `db/credits.sql` in Supabase.
2. Set:
   - `APP_MODE=open`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `FREE_CREDITS` if you want a value other than `30`
   - `NEXT_PUBLIC_APP_URL`
   - `ALLOWED_ORIGIN` if it differs from `NEXT_PUBLIC_APP_URL`
3. For multi-instance rate limits, set:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

For local demos of the open-mode UI only, use `CREDITS_BACKEND=memory`. The
memory backend is blocked in production and resets on process restart.

Credit costs are currently:

| Result type | Credits |
|-------------|---------|
| Clarification | 0 |
| Single-tool recommendation | 1 |
| Workflow recommendation | 3 |

The API reserves 3 credits before a metered recommendation and refunds the
difference after the result is known. BYOK requests bypass credits entirely.

## Stripe Top-Ups

Stripe top-ups are optional. To enable the `Top up` button:

1. Create a Stripe Price for the credit pack.
2. Set:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PRICE_ID`
   - `STRIPE_WEBHOOK_SECRET`
   - `CREDITS_PER_PURCHASE` if you want a value other than `100`
3. Point the Stripe webhook at:
   - `/api/v1/stripe/webhook`

Only `checkout.session.completed` grants credits.

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
pnpm validate-catalog
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
