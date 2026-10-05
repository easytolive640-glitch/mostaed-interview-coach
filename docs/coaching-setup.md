# Career coaching launch setup

This release adds a moderated coach application, public approved directory, date-based availability, authenticated session history, one-time PayPal checkout, automatic Zoom creation and calendar downloads. Sessions are 30 minutes, in USD, separate from AI subscriptions. English and Arabic UI are included. Mostaed collects payment; coach payout is manual and must be agreed before approval.

## Required activation

1. Run `docs/coaching.sql` in the existing Supabase project's SQL Editor. No public RLS policies are added; all access is through the authenticated server endpoint. Apply on a test project first and verify the exclusion constraint and concurrent reservation behavior.
2. Use the existing server-only Supabase environment variables. New variables: `COACHING_BOOKINGS_ENABLED=false` initially; `COACHING_SITE_URL=https://mostaed-interview-coach.vercel.app`; `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`. Never put credentials in client JavaScript or the repository.
3. Create/activate a Zoom Server-to-Server OAuth app on the Mostaed managed Zoom account with the meeting-create scope required for the API. Each approved coach must have a usable host identity on that Zoom account. This version does not connect independent external coach Zoom accounts: that requires per-coach OAuth authorization. Coaches start sessions from their own Zoom dashboard; host start URLs are never sent to clients.
4. Approve real coach applications only after verifying experience, agreeing payout/refund terms and assigning a distinct managed Zoom host (`career_coaches.zoom_host_id`). Update the profile status to `approved` in Supabase. No fabricated coach profiles are published.
5. Existing `PAYPAL_MODE`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` are used for **one-time Orders**, not recurring AI plans. Do not switch shared variables to sandbox in production if they support live AI subscriptions; use a separate Vercel preview/environment for sandbox tests. Paymob session checkout is not included in this release.
6. In a sandbox deployment set `COACHING_BOOKINGS_ENABLED=true`; use a sandbox buyer and a dedicated test Zoom host. Sandbox checkout creates test-labelled bookings and may create actual test Zoom meetings. Verify registration, moderation, coach slots, a successful capture, return-to-app confirmation, private links and calendar download. Confirm an unrelated account cannot access the booking and simultaneous buyers cannot reserve the same slot.
7. Live payments stay disabled until the full sandbox test passes, legal/payout/refund terms are agreed and the live payment-to-Zoom test is authorized.

## Operations and limits

- Slots are stored in UTC; the UI shows the viewer's browser timezone. Database exclusion constraints prevent overlapping slots per coach; reservations are atomic and unique per slot.
- A checkout reserves the slot durably. Unpaid holds do not auto-expire. Users can retry payment confirmation from My sessions; operations must verify an order is not captured before cancelling/releasing an abandoned hold. Never cancel a captured booking merely to free a slot.
- Payment is verified by the server against order ID, booking ID, exact currency/amount and completed capture, never by the return URL alone. PayPal request IDs prevent duplicate create/capture requests within provider retention. A settled booking must not be charged again.
- Automatic capture webhooks/notifications and scheduled reconciliation are not part of this first release. The buyer must return and verify; support can reconcile payment manually if the return is interrupted. There are no email reminders, payout automation, rescheduling UI or automated refunds yet.
- Meeting creation is claimed once with a database compare-and-set to avoid duplicate parallel creates. Ambiguous Zoom failures move to `meeting_review`, preserving payment. Support must inspect the host's meetings before adding the existing link or deliberately retrying; never blindly create a second meeting. A database failure after Zoom creation may leave `meeting_creating`; reconcile manually.
- Confirmed participant links are accessible only to the booking owner and the owning coach, not in directory responses. Zoom participant URLs contain access credentials; do not publish them. Host authentication and waiting rooms remain controlled by Zoom.
- Core validation and payment/meeting privacy tests: `node --test test/coaching.test.mjs`. These do not constitute an end-to-end sandbox verification or a database migration test.

Documentation: https://developers.zoom.us/docs/internal-apps/create/ and https://developer.paypal.com/checkout/put-it-all-together/
