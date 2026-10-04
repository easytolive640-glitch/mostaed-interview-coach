import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mostaed_interview_coach/models.dart';
import 'package:mostaed_interview_coach/question_bank.dart';
import 'package:mostaed_interview_coach/free_localizations.dart';
import 'package:mostaed_interview_coach/services/evaluation_service.dart';
import 'package:mostaed_interview_coach/services/history_service.dart';

void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));
  test('localized answers receive keyword and example credit in each new language', () async {
    for (final language in [AppLanguage.french, AppLanguage.spanish, AppLanguage.german]) {
      for (final category in InterviewCategory.values) {
        final questions = QuestionBank.forCategory(category);
        final example = {AppLanguage.french: 'exemple', AppLanguage.spanish: 'ejemplo', AppLanguage.german: 'beispiel'}[language]!;
        final answers = questions.map((q) => '$example ${q.keywordsFor(language).join(" ")} ${List.filled(40, "1234").join(" ")}').toList();
        final result = await EvaluationService().evaluate(category: category, language: language, questions: questions, answers: answers);
        expect(result.score, 100);
        expect(result.strengths.first, FreeLocalizations.text('completed', language.name));
        expect(result.usedRemoteAi, isFalse);
        await HistoryService.save(result);
        final saved = (await HistoryService.load()).first;
        expect(saved.language, language);
        expect(saved.strengths, result.strengths);
        final unrelated = await EvaluationService().evaluate(category: category, language: language, questions: questions, answers: List.filled(5, List.filled(40, '1234').join(' ')));
        expect(unrelated.score, 60);
      }
    }
  });
  test('all historical language values still round-trip', () {
    for (final language in AppLanguage.values) {
      final result = InterviewResult(category: InterviewCategory.hr, language: language, score: 70, strengths: ['sample'], improvements: ['sample'], completedAt: DateTime.utc(2026), usedRemoteAi: false);
      expect(InterviewResult.fromJson(result.toJson()).language, language);
    }
  });
}
