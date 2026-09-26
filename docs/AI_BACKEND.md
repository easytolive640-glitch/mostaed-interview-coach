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
  credit atomically before calling OpenAI. It accepts 10 Starter or 15 Pro text
  answers, an optional consented CV text extract, and one optional recorded voice
  answer (WebM or WAV, maximum 2 MB). Voice is transcribed only on the server for
  scoring; the transcript is never returned or saved by this application. CV and
  voice inputs are sent to OpenAI for evaluation and are not stored by this server.
  The result contains a total score plus separate text, voice, and CV consistency
  scores. The CV score measures how well the answers reflect the supplied CV,
  not hiring suitability.
- `docs/paid_access.sql`: subscription mapping and atomic monthly usage counter.

No checkout or paid AI UI is live yet. The current paid endpoint handles the
evaluation API, but microphone capture, CV text extraction, sign-in, checkout,
privacy controls, and end-to-end testing still need the paid client flow.
CV selection on the landing page is local-only and does not send a file anywhere.

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
   | `OPENAI_TRANSCRIPTION_MODEL` | Optional audio transcription model; default `gpt-transcribe` |
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
Pro evaluation covers 15; one optional voice answer can be included in both.
Attempts are reserved before an OpenAI request, even
if it fails, to bound API spend. The endpoint also rejects test purchases,
unapproved stores, mismatched customer emails, and missing configuration.
Audio can require an additional provider request and incur additional cost.

## Evaluation API shape (for the future paid client)

`POST /v1/evaluate` with `Authorization: Bearer <Supabase access token>` and
`Content-Type: application/json`:

```json
{
  "category": "itCloud",
  "language": "english",
  "responses": [{ "questionId": "q1", "question": "Describe an incident", "answer": "I diagnosed and resolved..." }],
  "cvText": "Optional text extracted locally from the user's CV (30-6000 characters)",
  "cvConsent": true,
  "voice": { "question": "Explain your approach", "format": "webm", "data": "<base64 recording>" }
}
```

Provide exactly 10 or 15 response objects, matching the authenticated plan.
Omit both `cvText` and `cvConsent` if the user has not consented to CV analysis.
Omit `voice` if there is no recording. Recordings are limited to 2 MB of actual
audio data; the application does not display a transcript. Never send the
server role, merchant, or OpenAI secret to the client.
OpenAI calls and payment fees are variable; a subscription sale does not imply
profit. Monitor provider spend and update caps/prices based on actual tests.
