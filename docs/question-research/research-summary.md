# November 2026 review summary

Updated 12 original practice questions in web and Flutter, with matching Arabic, English, French, Spanish, and German translations and local scoring keywords.

- HR (hr_6, hr_7, hr_18, hr_19): clarify feedback and check improvement; confirm changed deadline commitments; explain contributions with evidence; clarify stakeholder needs through feedback. Sources: CIPD feedback and selection guidance, SHRM career conversations, Microsoft Careers interview tips.
- Customer service (cs_4, cs_7, cs_17, cs_18): reliable answers and human handoff; escalation context and follow-up; verify AI drafts against approved guidance; minimize sensitive data collection, sharing, and access. Sources: Salesforce self-service, escalation documentation and service learnings, Agentforce guidance, Trailhead guardrails, ethical service documentation.
- IT/cloud (it_3, it_14, it_15, it_16): evidence-based permission reduction; coordinate regional outage response; safe recovery drills and emergency access; test access policies before deployment. Sources: AWS IAM and security architecture guidance, historical AWS Well-Architected principles, Microsoft and Azure incident management guidance.

[Monthly evidence register](2026-11.md) records exact supplied URLs, titles, access timestamps, evidence dates, date uncertainty, and reasons. Evidence came exclusively from the supplied hosted research collected on 2026-11-01; the editor made no network requests. Older and undated material supports established practices rather than new trend claims. Unsupported HR ethical-AI, cloud cost, and AI infrastructure-review changes were not fabricated.

Validation passed: `node --test test/practice_questions.test.mjs test/localization.test.mjs test/evaluation-context.test.mjs test/evaluation-history.test.mjs` (4 files, zero failures); static checks confirmed 60 aligned ordered IDs, all five language strings within the server's 300-character limit, and 36 updated localized keyword entries. `git diff --check` passed. Flutter was not attempted; the next workflow step performs SDK validation. No tests were changed.

Banks retain 20 questions per category, stable competency IDs, UTC monthly selection, and counts of 5 free / 10 Starter / 15 Pro. November free and paid selections each include refreshed topics in every category. Stored history schemas and session selection behavior are unchanged.

Limitation requiring publication review: an already-open paid client with old wording cannot submit after a future server bank deployment because existing validation requires exact current text. Cross-deployment version compatibility cannot be fixed within the permitted content files; this change preserves session selection within a running client but does not claim to solve that existing server constraint. Page dates were not independently verified, and automated translation checks do not replace linguistic review.

This is content prepared for a review pull request, not a deployed update. No commit, push, merge, or GitHub action was performed. Unrelated pre-existing workspace changes were left untouched.
