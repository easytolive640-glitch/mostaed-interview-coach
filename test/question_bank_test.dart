import 'package:flutter_test/flutter_test.dart';
import 'package:mostaed_interview_coach/models.dart';
import 'package:mostaed_interview_coach/question_bank.dart';

void main() {
  test('each role keeps five free questions and adds paid depth', () {
    for (final category in InterviewCategory.values) {
      final free = QuestionBank.forCategory(category);
      final starter = QuestionBank.forPaidCategory(category, PaidPlan.starter);
      final pro = QuestionBank.forPaidCategory(category, PaidPlan.pro);

      expect(free.length, 5);
      expect(starter.length, 10);
      expect(pro.length, 15);
      expect(starter.take(5).map((question) => question.id),
          free.map((question) => question.id));
      expect(pro.map((question) => question.id).toSet().length, 15);
      for (final question in pro) {
        expect(question.text(AppLanguage.arabic).trim(), isNotEmpty);
        expect(question.text(AppLanguage.english).trim(), isNotEmpty);
      }
    }
  });

  test('paid sessions rotate monthly and have unique bilingual questions', () {
    for (final category in InterviewCategory.values) {
      for (final plan in PaidPlan.values) {
        final january = QuestionBank.forPaidCategory(category, plan, asOf: DateTime.utc(2027, 1, 31));
        final february = QuestionBank.forPaidCategory(category, plan, asOf: DateTime.utc(2027, 2, 1));
        expect(january.map((q) => q.id), QuestionBank.forPaidCategory(category, plan, asOf: DateTime.utc(2027, 1, 1)).map((q) => q.id));
        expect(january.map((q) => q.id).toList(), isNot(february.map((q) => q.id).toList()));
        expect(february.map((q) => q.id).toSet().length, february.length);
        expect(february.take(5).map((q) => q.id), QuestionBank.forCategory(category).map((q) => q.id));
        for (final question in february) {
          expect(question.text(AppLanguage.arabic).trim(), isNotEmpty);
          expect(question.text(AppLanguage.english).trim(), isNotEmpty);
        }
      }
    }
  });
}
