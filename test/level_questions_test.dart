import 'package:flutter_test/flutter_test.dart';
import 'package:mostaed_interview_coach/models.dart';
import 'package:mostaed_interview_coach/question_bank.dart';
import 'package:mostaed_interview_coach/level_question_translations.dart';
void main() {
  test('all free assessment levels have genuine translations in every supported language', () {
    for (final category in InterviewCategory.values) {
      for (final level in ['entry', 'mid', 'expert', 'consultant']) {
        final questions = QuestionBank.forCategory(category, level: level);
        expect(questions.length, 5);
        for (final question in questions) {
          for (final language in [AppLanguage.french, AppLanguage.spanish, AppLanguage.german]) {
            expect(levelQuestionTranslations[language.name]?[question.id], isNotNull);
            expect(question.text(language), isNot(question.english));
            expect(question.keywordsFor(language), isNotEmpty);
          }
        }
      }
    }
  });
}
