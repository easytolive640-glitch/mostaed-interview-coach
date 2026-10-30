import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mostaed_interview_coach/main.dart';
import 'package:mostaed_interview_coach/models.dart';
import 'package:mostaed_interview_coach/question_bank.dart';

void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));
  testWidgets('home screen supports language switching',
      (tester) async {
    await tester.pumpWidget(const MostaedApp());

    expect(find.text('الموارد البشرية'), findsOneWidget);
    await tester.tap(find.text('English'));
    await tester.pumpAndSettle();
    expect(find.text('Human resources'), findsOneWidget);
    expect(find.text('Customer service'), findsOneWidget);
  });

  testWidgets('new languages show localized categories and interview questions', (tester) async {
    await tester.pumpWidget(const MostaedApp());
    await tester.pumpAndSettle();
    for (final pair in [
      ['Français', 'Ressources humaines', AppLanguage.french],
      ['Español', 'Recursos humanos', AppLanguage.spanish],
      ['Deutsch', 'Personalwesen', AppLanguage.german],
    ]) {
      await tester.tap(find.text(pair[0] as String));
      await tester.pumpAndSettle();
      await tester.tap(find.text(pair[1] as String));
      await tester.pumpAndSettle();
      final question = QuestionBank.forCategory(InterviewCategory.hr).first;
      final translated = question.text(pair[2] as AppLanguage);
      expect(translated, isNot(question.english));
      expect(find.text(translated), findsOneWidget);
      await tester.pageBack();
      await tester.pumpAndSettle();
    }
    expect((await SharedPreferences.getInstance()).getString('mostaed_language'), 'german');
  });

  testWidgets('free interview is text-only in both languages', (tester) async {
    await tester.pumpWidget(const MostaedApp());

    await tester.tap(find.text('الموارد البشرية'));
    await tester.pumpAndSettle();
    expect(find.text('استمع للسؤال'), findsNothing);
    expect(find.text('أجب بصوتك'), findsNothing);
    expect(tester.widget<TextField>(find.byType(TextField)).decoration?.hintText,
        contains('اكتب إجابتك'));

    await tester.pageBack();
    await tester.pumpAndSettle();
    await tester.tap(find.text('English'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Human resources'));
    await tester.pumpAndSettle();
    expect(find.text('Listen to question'), findsNothing);
    expect(find.text('Answer by voice'), findsNothing);
    expect(tester.widget<TextField>(find.byType(TextField)).decoration?.hintText,
        contains('Write your answer'));
  });
}
