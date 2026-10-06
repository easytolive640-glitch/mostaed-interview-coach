# Acquisition funnel measurement

GA4 ID G-8QJ52F51ND was observed in the deployed GitHub Pages free-practice shell on 6 October 2026. The landing page and account/paid modules now use the same ID. No GA administrator setting was changed.

Free branch: landing_view → free_practice_clicked → practice_started → practice_completed (last two existing Flutter events).
Paid branch: paid_practice_clicked/account_clicked → sign_up/login → begin_checkout → checkout_redirected or checkout_failed → payment_verified (filter environment=live) → paid_practice_ready → paid_practice_started → evaluation_submitted → evaluation_completed or evaluation_failed. paid_access_blocked identifies access failures, not a proven payment failure.

These are diagnostic events, not a revenue ledger. payment_verified is a browser acknowledgement of the server verification result, may repeat, and is not a GA purchase event. Do not infer unique paid customer counts from its event count; reconcile against the admin subscription records. Existing subscribers can skip signup and checkout. Free and paid branches should be separate funnels, not one mandatory sequence.

Only allowlisted enum parameters are transmitted. No answers, CVs, audio, emails, user identifiers, provider IDs or raw error messages. Account URL queries and hashes are stripped. Safe alphanumeric UTM identifiers become campaign fields. Google signals and ad personalization signals disabled in this configuration. Admin and coaching private pages are not tagged by this change.

Cross-domain linker configured for Mostaed Vercel and its GitHub Pages host. The free shell build injection now configures the same linker. Validate after the GitHub Pages build finishes; live cross-domain/session continuity and receipt in GA4 remain unverified until property access is restored. GitHub Pages source uses repository variable MOSTAED_GA4_ID, which already produced the observed live tag.

To read results: use the Mostaed property, last 14 days, compare traffic source/medium, then events and separate open funnels in Explore. New instrumentation cannot reconstruct past clicks. Count users/session-based conversion separately from repeated event counts. Wait for sufficient relevant traffic before concluding where conversion fails.

Access audit: the cloud browser reported Missing permissions for account 370212761/property 507238415 and redirected to account 128156195/property 0. No live visitor counts were read; no drop-off rate can currently be asserted.
