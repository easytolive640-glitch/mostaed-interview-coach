# Mostaed notifications

Deployment pending approval of a new Cloudflare D1 database. No new plan is required; D1/Workers usage can incur overages beyond included allowances.

The Worker uses a native EMAIL binding restricted to info@mostaedcoach.com and a D1 DB binding. Route only mostaedcoach.com/api/notifications. Cron: */15 * * * *. Public Supabase URL and publishable key are environment bindings; no service-role or SMTP token is needed.

POST requires the exact Mostaed Origin and a Supabase bearer token. The recipient is taken only from the authenticated user. Welcome is limited to verified accounts created in the preceding 24 hours, once per account. ?test=1 is restricted to the owner email and one job/day. The account page must POST here after successful login without blocking login on failure.

At most 90 send attempts/day; at most three attempts/job, with 15-minute retry delay and 24-hour expiry. Delivery can duplicate after an ambiguous provider failure. Recipient and detail are cleared after success or expiry. IDs remain to prevent repeated welcomes. Basic health checks cover homepage and account-config HTTP status only, not payments/AI/Supabase readiness. Alerts require two failures and are limited to one per endpoint/day. Alerts use the same email service, so email-service outages cannot be reported by email.

Existing Resend admin login notifications remain unchanged. No emails are sent to existing users automatically. This is transactional onboarding, not a marketing campaign.
