# PayPal activation checklist
Paid AI fails closed until these settings exist. Do not enable billing until a sandbox purchase and refund/cancellation tests pass.

Production server secrets: OPENAI_API_KEY (replacement key), PAYPAL_CLIENT_SECRET, SUPABASE_SERVICE_ROLE_KEY.
Production configuration: PAYPAL_MODE=live, PAYPAL_CLIENT_ID (REST app client ID), PAYPAL_PRO_PLAN_ID=P-5JG29269ME5644941NK74GAI, PAYPAL_WEBHOOK_ID, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, ALLOWED_ORIGIN=https://mostaed-interview-coach.vercel.app.
Keep BILLING_ENABLED=false and PAID_AI_ENABLED=false until readiness checks pass.

The SDK button client ID is not assumed to be a REST app credential. Use a PayPal REST app owned by the merchant that owns the plan. Never paste secrets into chat or put them in frontend files.

Run docs/paid_access.sql in Supabase first. Then run docs/paypal_access.sql. Configure Supabase email confirmations and email/password accounts. /account.html signs in through Supabase and creates subscriptions on the server with custom_id set to the authenticated user UUID. Existing subscriptions created with the old standalone button lack this binding and cannot unlock AI.

Register https://mostaed-interview-coach.vercel.app/api/paypal-webhook in the matching PayPal app. Subscribe to BILLING.SUBSCRIPTION.ACTIVATED, UPDATED, CANCELLED, SUSPENDED, EXPIRED, PAYMENT.FAILED and PAYMENT.SALE.COMPLETED, REFUNDED, REVERSED. Signature verification, current provider status, plan, account ownership and a completed $7.99 USD transaction are required. Refund/reversal holds require merchant support review and cannot be cleared by client verification.

Sandbox requires separate sandbox REST app, plan and webhook; sandbox payments never unlock production AI. After sandbox tests, test the live API key privately, confirm taxes/cancellation terms, and complete a controlled live checkout before opening billing. No live payment or AI test was performed during implementation.

The account portal prepares verified entitlement; connecting that session to the Flutter paid-practice UI remains required for the full customer journey. Free practice remains unchanged. Do not advertise paid plans as active yet.
