# Monthly job profile review

Paid Starter and Pro select different questions each UTC calendar month from the bilingual bank in `lib/question_bank.dart`. The free five questions remain stable. Rotation does not mean the bank has automatically learned new job requirements. The monthly review issue reminds us to check profiles, update questions and keywords, and record sources and dates here. Describe content as current only after a source review.

## Review checklist

1. Compare HR, customer service and IT/cloud role descriptions with recent, permitted sources. Check local market vacancies when accessible and cite each advert URL and date internally; do not reproduce an advert's text without permission.
2. Check occupational baseline: [O*NET Human Resources Specialists](https://www.onetonline.org/link/summary/13-1071.00), [Customer Service Representatives](https://www.onetonline.org/link/summary/43-4051.00), [Network and Computer Systems Administrators](https://www.onetonline.org/link/summary/15-1244.00). This US baseline may not reflect current local vacancies. If adapting its content, attribute **O*NET OnLine, National Center for O*NET Development, CC BY 4.0**.
3. Update or replace questions in Arabic and English with unique IDs, review scoring keywords and keep five free plus at least fifteen paid pool questions per category.
4. Run Flutter analyze and question bank tests. Record sources, review date and changes below before merging. If no source changed, record that; monthly rotation changes selection, not content.
5. Paid AI and checkout are inactive. Before activation, ensure the server checks plan and question count and a session retains its question set across the month boundary.

## Review log

| Reviewed UTC | Roles | Sources checked | Content decision |
| --- | --- | --- | --- |
| Pending | HR, customer service, IT/cloud | O*NET baseline links above | Initial twenty bilingual questions per role; no completed monthly market review claimed. |

The scheduled GitHub Action opens a review issue on the first day of each UTC month. It does not modify questions or assert that a source is fresh.
