# Mostaed test checkout

Open https://mostaed-interview-coach.vercel.app/checkout-test.html after signing in through the account page. Test payments never unlock live AI and never change the existing live PayPal subscription.

## Paymob

1. In Supabase SQL Editor, run the complete `docs/paymob_test.sql` file. This creates an isolated test ledger with service-role-only access. Do not skip this step: checkout fails closed without it.
2. Vercel Production variables: PAYMOB_MODE=test, PAYMOB_SECRET_KEY (test secret), PAYMOB_PUBLIC_KEY (test public key), PAYMOB_HMAC_SECRET (secret), PAYMOB_CARD_INTEGRATION_ID (test EGP card integration). Redeploy after any variable changes.
3. The server supplies the processed callback https://mostaed-interview-coach.vercel.app/api/paymob-webhook and return URL https://mostaed-interview-coach.vercel.app/checkout-test.html?provider=paymob when creating the payment intention. Configure the same URLs in the integration if requested.
4. Use Paymob's documented test card only: Visa 4111111111111111, expiry 01/39, CVV 123, name Test Account. Enter test billing details. Never use a real card on this test page.
5. Complete checkout, then click Check test payment. Confirm paid only after the signed webhook is saved. Also test declined/cancelled payments. Amount is EGP 418, one-time; this does not configure recurring billing.

Official test cards: https://developers.paymob.com/paymob-docs/getting-started/test-credentials

## PayPal sandbox

1. Open https://developer.paypal.com/dashboard/ and create/select a sandbox REST app for a sandbox Business merchant. Use a separate sandbox Personal buyer account to test.
2. Create an ACTIVE monthly USD 7.99 sandbox subscription plan with one regular billing cycle, no trial and no setup fee.
3. Save three NEW Vercel Production variables: PAYPAL_SANDBOX_CLIENT_ID (Config), PAYPAL_SANDBOX_CLIENT_SECRET (Secret), PAYPAL_SANDBOX_PRO_PLAN_ID (Config). Redeploy. Keep all existing live PAYPAL variables unchanged.
4. Click PayPal sandbox on the test page. Sign in with the sandbox Personal buyer, approve, return, and check verification. An active subscription alone is insufficient: a completed USD 7.99 payment for the correct account and plan is required.

## Verification status

37 automated tests passed using simulated provider responses. No real Paymob test transaction or PayPal sandbox buyer transaction has been completed by the assistant. The SQL migration requires execution in your Supabase project, and sandbox credentials must come from your own PayPal developer account. The assistant does not supply merchant test credentials.
