# Mostaed Paymob test checkout

Open https://mostaedcoach.com/checkout-test.html and sign in through the account page. The test uses Paymob's hosted Unified Checkout and records payment outcomes only in the test ledger.

1. Confirm the test EGP card integration is enabled in the Paymob merchant dashboard. The test configuration needs the test public and secret keys, the HMAC secret, and the test card integration ID. Set `PAYMOB_MODE=test` in the deployment used for testing.
2. Apply `docs/paymob_test.sql` in the test environment if the test ledger has not been created.
3. Start a test checkout. Mostaed creates a one-time EGP payment intention, records the order, then redirects to Paymob. Use a card from Paymob's official test card guide. Paymob sends the result to `https://mostaedcoach.com/api/paymob-webhook`.
4. After returning to Mostaed, confirm that the payment is marked paid only after the signed webhook arrives. Repeat with a declined card and with an abandoned checkout. A browser redirect alone does not grant access.

Paymob's [integration checklist](https://developers.paymob.com/paymob-docs/getting-started/integration-checklist) separates test validation from technical approval and issuance of live credentials. See `docs/PAYMOB_LIVE_SETUP.md` for the production rollout.
