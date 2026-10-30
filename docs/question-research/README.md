# Monthly question research

GitHub Actions runs `monthly-question-research.yml` on the first day of each month at 05:00 UTC, and supports manual runs. It uses live web search through Codex, revises original role-specific questions and translations, validates JavaScript and Flutter banks, and opens a content review PR. Merging that PR deploys through the existing site pipelines. The workflow does not auto-merge generated content.

Required repository Actions secret: `OPENAI_API_KEY`, reusing the existing Mostaed API key. Never commit a key. Vercel environment secrets are not automatically available in GitHub Actions. Repository settings must allow Actions to create pull requests. Missing credentials or failed checks stop the run without changing live questions.

Each review must log sources and dates in a YYYY-MM.md file. Existing deterministic monthly rotation continues even if research fails; rotation alone is not new research. API use incurs usage charges. Review each PR for question quality, translations, history compatibility and the evidence supporting the changes.
