# مستعد – AI Interview Coach

An Arabic-first interview-practice application for Android and the web.

## Run locally

1. Install Flutter and Android Studio.
2. From the folder above this project, run:
   `flutter create --platforms=android mostaed_interview_coach`
3. Keep the included `lib/main.dart`, `pubspec.yaml`, and
   `analysis_options.yaml` if Flutter asks about replacing files.
4. Run `flutter pub get` and then `flutter run`.

## Current beta

- Arabic RTL and English interfaces.
- HR, customer service, and IT/cloud categories.
- Structured bilingual question bank.
- Rubric-based scoring with actionable feedback.
- Persistent on-device interview history.
- Local scoring for the free plan; paid AI endpoint remains disabled until subscription verification is configured.

## Next milestones

- Connect the protected OpenAI backend to the paid client after merchant approval and live account configuration. The backend can score an optional recorded answer and a consented CV text extract, but the paid client is not live.
- Add a separate recorded voice question to the paid client; keep free text questions text-only. Voice transcription occurs privately on the paid server for evaluation and is not shown in the app.
- Add authentication UI and connect it to the existing server-side monthly usage limits.
- Add Google Play Billing after beta validation.
- Expand roles based on beta analytics.

## Product constraints

- AI must evaluate answers, never invent credentials or experience.
- API keys must never be embedded in the app.
- The app must remain useful when AI evaluation is unavailable.
- The initial release stays focused on HR, customer service, and IT/cloud.
