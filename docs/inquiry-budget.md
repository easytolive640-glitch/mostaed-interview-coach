# Inquiry chatbot: $5 monthly allowance

Apply `docs/inquiry_monthly_budget.sql` in the project's Supabase SQL editor,
then deploy the API. The SQL migration is additive and does not modify daily
quotas, account permissions, or paid-evaluation allowances.

Every attempted provider call reserves $0.01 in a persistent, atomic database
counter before OpenAI is contacted. At most 500 calls can be reserved per UTC
calendar month. Errors, timeouts and unused output do not refund reservations.
The existing global 100/day and per-client 10/day limits still apply.

The reservation exceeds the supported model's maximum request cost at standard
prices verified on 2026-10-30: input $0.40/million and output $1.60/million.
The API pins GPT-4.1 mini, limits the full prompt to 12,000 UTF-8 bytes (a
conservative text-token bound), allows 1,024 extra framing tokens, caps output
at 300 tokens and requests the default service tier. No tools or retries are
enabled. Review the reservation before changing provider prices or models.
Source: https://developers.openai.com/api/docs/models/gpt-4.1-mini

If the monthly allowance is exhausted, the database is unavailable, the migration
is absent, the model override is unsupported, or the prompt exceeds its bound,
the endpoint returns its existing free FAQ answer without an OpenAI request.

This is a conservative application allowance, not OpenAI invoice tracking.
It covers this inquiry endpoint after deployment. Prior usage, other applications
sharing the key, monthly question research, paid evaluations, taxes and hosting
are outside this counter. Actual token charges should be below the reserved
amount. At the next UTC month, a new counter is created automatically.

Read-only verification in Supabase:

```sql
select month, reserved_micro_usd / 1000000.0 as reserved_usd,
       (5000000 - reserved_micro_usd) / 1000000.0 as remaining_allowance_usd
from public.inquiry_monthly_budget
order by month desc;
```
