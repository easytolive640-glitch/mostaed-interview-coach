# Landing inquiry assistant

The floating bilingual assistant answers common product questions immediately without provider calls. It labels saved FAQ answers and AI answers separately. Chat content is rendered as plain text and not stored in browser storage.

To activate optional AI responses:
1. Run docs/inquiry_quota.sql in Supabase SQL Editor.
2. In Vercel Production set INQUIRY_OPENAI_API_KEY as Secret (a separate project key), INQUIRY_AI_ENABLED=true as Config, and optionally INQUIRY_MODEL=gpt-4.1-mini as Config. Redeploy.
3. The existing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are used for quota reservation. The paid OPENAI_API_KEY is never used by this assistant.

Limits: 500-character input, 300 output tokens per provider request, 10 requests per hashed IP per UTC day and 100 globally per UTC day. Quotas are atomic and fail closed if the SQL is missing. Provider failures use saved FAQ answers. These limits are not a currency spending cap; configure a separate OpenAI project budget/alerts too. AI requires visitors to consent to sending their question to OpenAI. No CV or file upload, payment processing or account changes are performed by the chat.

Check /api/inquiry for aiEnabled. A true flag indicates configuration presence, not a completed provider request. Verify a non-FAQ question with consent and mode=ai before claiming live AI has been tested.
