# Mostaed admin dashboard

Open `/admin.html` after signing in in the same tab. The existing server-only `COACHING_ADMIN_EMAILS` allowlist and a verified Supabase email gate every data request. Client metadata cannot grant access. No new public table policies or browser service-role keys are introduced.

The dashboard reads registered accounts, paid_subscriptions, career_coaches, coaching_slots, coaching_bookings and paymob_test_checkouts. Records are paginated, with an explicit unavailable state for failed or over-limit sources. Unknown sources never display zero. No new database migration is needed.

Plan totals count unique accounts per plan and payment environment. A user with multiple subscriptions is counted once per plan. Free accounts are registered accounts without active live paid access, including expired/unverified accounts. Anonymous free-practice usage is not measured here. Starter remains unavailable for purchase. Subscription creation failures that never reached the saved ledger are not counted.

Subscription status reflects the saved webhook/verification state. The payment-details action reads the matching PayPal live or sandbox environment for the last 30 days of transactions and the provider's latest payment. It does not grant access, capture payments or change subscriptions. This is not a historical revenue or settlement ledger. Paymob entries are test checkouts only.

Session rows show booking status, captured-payment reference, quoted amount and environment. No verified capture is not presented as paid. Bookings and payments are never altered by refresh. Zoom participant links, host credentials and private CV storage paths are not included in dashboard responses.

Approve or pause uses the existing authenticated coach-review API. Approval requires LinkedIn/CV review confirmation and a managed Zoom host. New email alerts link directly to the dashboard review section. Existing approval emails continue to work. Pending/paused applicants see application status and credential updates; only approved coaches see the operational dashboard and availability.

Validation: admin authorization, source pagination, distinct plan counts, environment separation, unavailable-source reporting, safe data projection, five-language UI, approve request format, and pending/approved dashboard visibility.
