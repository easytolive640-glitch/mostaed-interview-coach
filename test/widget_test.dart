import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mostaed_interview_coach/main.dart';

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
      ['Français', 'Ressources humaines', 'Parlez-moi de vous et de votre expérience professionnelle.'],
      ['Español', 'Recursos humanos', 'Háblame de ti y de tu experiencia profesional.'],
      ['Deutsch', 'Personalwesen', 'Erzählen Sie von sich und Ihrer Berufserfahrung.'],
    ]) {
      await tester.tap(find.text(pair[0]));
      await tester.pumpAndSettle();
      await tester.tap(find.text(pair[1]));
      await tester.pumpAndSettle();
      expect(find.text(pair[2]), findsOneWidget);
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
