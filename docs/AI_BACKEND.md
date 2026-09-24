# Paid AI activation checklist

The free web and Android practice uses on-device rubric scoring. It never calls OpenAI.
The Vercel API is **off by default** and will not call OpenAI until all paid-access
configuration exists and `PAID_AI_ENABLED=true`. Do not add a provider key as a
client or GitHub Actions secret.

## What is implemented

- `POST /api/checkout`: creates a Lemon Squeezy checkout for an authenticated
  Supabase user and binds the checkout to their user ID. Defaults to unavailable.
- `POST /api/lemon-webhook`: verifies the Lemon Squeezy HMAC before updating a
  subscriber record. Only subscriptions from the configured store and variants
  are accepted. Checkout email must match the account email.
- `POST /v1/evaluate`: requires a Supabase bearer token, looks up its subscription,
  confirms it is **active and live** with Lemon Squeezy, then reserves a monthly
  credit atomically before calling OpenAI. Responses are not stored on the server.
- `docs/paid_access.sql`: subscription mapping and atomic monthly usage counter.

No checkout or paid AI UI is live yet. The previously developed recorded voice
question remains in a separate, unmerged branch. The current paid endpoint
accepts **10 text answers for Starter or 15 for Pro**, validated against the
subscription. It does not yet process voice. CV selection on the landing page
is local-only.

## Setup required before accepting money

1. Rotate the OpenAI key visible in the shared screenshot and set a small API
   spend limit in the OpenAI account. Create a new server-only project key.
2. Finish Lemon Squeezy identity/store approval. In **test mode**, create the
   Starter and Pro monthly subscription variants. Check real margins and terms
   before publishing the displayed proposal prices ($3.99 and $7.99/month).
   The current Vercel **Hobby** plan is restricted to non-commercial use. Before
   selling subscriptions, upgrade to a commercial Vercel plan or move the paid
   backend/landing site to a host whose free terms allow commercial activity.
3. Create a Supabase project on the free tier. Enable email authentication,
   configure the site's redirect URLs, and run `docs/paid_access.sql` in its SQL
   editor. Verify the table and RPC access with a test user.
4. Configure the Vercel project (production values are server-side secrets):

   | Variable | Purpose |
   | --- | --- |
   | `SUPABASE_URL` | Exact `https://<project>.supabase.co` URL |
   | `SUPABASE_PUBLISHABLE_KEY` | Public Supabase API key used server-side to validate sessions |
   | `SUPABASE_SERVICE_ROLE_KEY` | Secret; server-only database access |
   | `LEMON_API_KEY` | Secret Lemon Squeezy API key (test and live keys differ) |
   | `LEMON_WEBHOOK_SECRET` | Secret chosen when configuring webhook |
   | `LEMON_STORE_ID` | Numeric store ID |
   | `LEMON_STARTER_VARIANT_ID` | Numeric Starter subscription variant ID |
   | `LEMON_PRO_VARIANT_ID` | Numeric Pro subscription variant ID |
   | `OPENAI_API_KEY` | **New** secret OpenAI key; never use the exposed one |
   | `OPENAI_MODEL` | Optional text model; default `gpt-5-nano` |
   | `LEMON_TEST_MODE` | `true` for test checkouts; test purchases never unlock live AI |
   | `BILLING_ENABLED` | Set `true` only when test checkout flow is ready |
   | `STORE_LIVE_APPROVED` | Set `true` only after merchant approval and live products |
   | `PAID_AI_ENABLED` | Set `true` **last**, only after end-to-end tests |

5. Register `https://mostaed-interview-coach.vercel.app/api/lemon-webhook`
   in Lemon Squeezy for `subscription_created`, `subscription_updated`,
   `subscription_cancelled`, `subscription_expired`, `subscription_resumed`,
   `subscription_paused`, and `subscription_unpaused`. Use the same secret as
   `LEMON_WEBHOOK_SECRET`. Test a signed event, including cancellation.
6. Build sign-in and paid UI for web/Android. The user must log in with Supabase
   before checkout and send the access token to the paid API. After a successful
   checkout, wait for the webhook before granting access. A checkout redirect
   alone is never proof of payment. Set up account/billing management and a
   privacy policy before requesting CV or voice recordings.
7. Once approved, copy test products to **live** mode, replace all Lemon test
   IDs and API key with live ones, set `LEMON_TEST_MODE=false`, and test a real
   low-cost purchase, renewal/cancellation, credit exhaustion, and failed OpenAI
   request. Then enable `PAID_AI_ENABLED` and publish the paid UI.

## Usage and cost limits

The current proposal is 20 AI evaluation attempts per UTC calendar month for
Starter and 100 for Pro. Each Starter evaluation covers 10 text answers and each
Pro evaluation covers 15; one additional voice answer is planned for both.
Attempts are reserved before an OpenAI request, even
if it fails, to bound API spend. The endpoint also rejects test purchases,
unapproved stores, mismatched customer emails, and missing configuration.
OpenAI calls and payment fees are variable; a subscription sale does not imply
profit. Monitor provider spend and update caps/prices based on actual tests.
