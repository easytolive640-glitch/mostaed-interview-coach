# Paid plans and payment diagnostics

AI Starter is USD 3.99 monthly, 10 written questions, up to 20 evaluations per
UTC calendar month. AI Pro is USD 7.99 monthly, 15 questions, up to 100.
Both support optional CV context and one voice answer.

Set `PAYPAL_STARTER_PLAN_ID` and `PAYPAL_PRO_PLAN_ID` to separate active,
monthly USD plans belonging to the same PayPal app/seller as the credentials
and webhook. Do not reuse a sandbox plan in live mode or a Pro plan for Starter.
`BILLING_ENABLED=true` enables only plans with configured IDs. A missing ID
keeps that plan's checkout disabled. Existing paid_access.sql supports both
plans and their quotas; no new database tables are required.

After changing production environment variables, redeploy. The public
`/api/account-config` returns plan availability without exposing plan IDs or
merchant credentials. Test a real purchase with a buyer distinct from the
seller; activation alone is insufficient. Verification requires a matching
user, plan, USD amount, future billing date and completed payment transaction.

In Vercel → Mostaed project → Logs, search for `mostaed_payment` or the
reference shown beside a checkout/verification error. Structured entries
include stage, outcome, environment, reference, internal account ID and plan
where available. Provider HTTP status, allowlisted issue code and debug ID
help PayPal support investigate. Logs exclude passwords, tokens, emails,
card information and raw provider responses. Vercel retention depends on
the hosting plan; these logs are not a permanent accounting ledger.

PayPal-hosted sign-in errors are outside Mostaed's server and cannot be
captured automatically. A checkout redirect is not evidence of payment.
Invalid webhook signatures are logged and cannot update entitlement.

Validation: `node --test test/paypal_access.test.mjs test/billing-plans.test.mjs test/admin.test.mjs`.
