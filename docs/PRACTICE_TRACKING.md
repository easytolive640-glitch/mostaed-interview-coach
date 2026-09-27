# Free practice funnel tracking

The landing page uses Vercel Web Analytics. The free interview runs on GitHub Pages, so Vercel page views alone cannot count finished practice sessions. Vercel Hobby does not show custom events. This optional integration uses a GA4 **web data stream** for the Flutter web beta.

## Activate

1. Create a free Google Analytics 4 property and a **Web** data stream for `https://easytolive640-glitch.github.io/mostaed-interview-coach/`.
2. Copy its public measurement ID (starts with `G-`). Do not share an API secret or a Google password.
3. In GitHub, open **Settings → Secrets and variables → Actions → Variables → New repository variable**. Set `MOSTAED_GA4_ID` to the measurement ID.
4. Rerun **Web Beta** under Actions, or push a commit to main. GitHub Pages deploys the rebuilt Flutter web app.

When the variable is absent, the app still builds and runs, but no practice events are sent. Android builds do not send these web events.

## What counts

- `practice_started`: when a user enters a free interview screen for a role.
- `practice_completed`: after the final answer is evaluated and the result is saved successfully.

No answer text, CV, name or score is sent with these events. A user can start several sessions, so event counts are session actions, not unique people. In GA4, view the two events under **Reports → Engagement → Events**; use Realtime or DebugView for an initial smoke test. For a simple completion ratio, divide completed event count by started event count over the same date range. GA4 reporting can lag.

Keep the Vercel landing visitor count separate from GA4 app events; they measure different sites and sessions.
