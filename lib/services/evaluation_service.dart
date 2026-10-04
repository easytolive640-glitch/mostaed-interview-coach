import '../models.dart';
import '../free_localizations.dart';

class EvaluationService {
  Future<InterviewResult> evaluate({required InterviewCategory category, required AppLanguage language, required List<InterviewQuestion> questions, required List<String> answers}) async {
    return _evaluateLocally(category: category, language: language, questions: questions, answers: answers);
  }

  InterviewResult _evaluateLocally({required InterviewCategory category, required AppLanguage language, required List<InterviewQuestion> questions, required List<String> answers}) {
    var total = 0.0;
    var keywordHits = 0;
    for (var i = 0; i < answers.length; i++) {
      final normalized = answers[i].toLowerCase();
      final lengthScore = (answers[i].length / 180).clamp(0.0, 1.0);
      final hits = questions[i].keywordsFor(language).where((keyword) => normalized.contains(keyword.toLowerCase())).length;
      keywordHits += hits;
      final relevance = (hits / 2).clamp(0.0, 1.0);
      final example = RegExp(r'example|result|because|when|exemple|résultat|parce que|lorsque|ejemplo|resultado|porque|cuando|beispiel|ergebnis|weil|als|مثال|نتيجة|لأن|عندما|موقف', caseSensitive: false).hasMatch(answers[i]);
      total += 35 + (lengthScore * 25) + (relevance * 30) + (example ? 10 : 0);
    }
    final score = (total / answers.length).round().clamp(0, 100).toInt();
    String tr(String key) => FreeLocalizations.text(key, language.name);
    return InterviewResult(category: category, language: language, score: score,
      strengths: [tr('completed'), if (keywordHits >= answers.length) tr('concepts'),
        if (answers.any((answer) => answer.length >= 140)) tr('detail')],
      improvements: [tr('star'), if (keywordHits < answers.length) tr('requirements'),
        if (answers.any((answer) => answer.length < 100)) tr('examples')],
      completedAt: DateTime.now(), usedRemoteAi: false);
  }
}
