import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mostaed_interview_coach/main.dart';

void main() {
  testWidgets('home screen supports language switching',
      (tester) async {
    await tester.pumpWidget(const MostaedApp());

    expect(find.text('الموارد البشرية'), findsOneWidget);
    await tester.tap(find.text('English'));
    await tester.pumpAndSettle();
    expect(find.text('Human resources'), findsOneWidget);
    expect(find.text('Customer service'), findsOneWidget);
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
