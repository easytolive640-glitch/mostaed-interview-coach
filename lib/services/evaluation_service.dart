import '../models.dart';

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
      final hits = questions[i].keywords.where((keyword) => normalized.contains(keyword.toLowerCase())).length;
      keywordHits += hits;
      final relevance = (hits / 2).clamp(0.0, 1.0);
      final example = RegExp(r'example|result|because|when|مثال|نتيجة|لأن|عندما|موقف', caseSensitive: false).hasMatch(answers[i]);
      total += 35 + (lengthScore * 25) + (relevance * 30) + (example ? 10 : 0);
    }
    final score = (total / answers.length).round().clamp(0, 100).toInt();
    final isArabic = language == AppLanguage.arabic;
    return InterviewResult(category: category, language: language, score: score, strengths: [isArabic ? 'أكملت جميع أسئلة المقابلة.' : 'You completed every interview question.', if (keywordHits >= answers.length) isArabic ? 'استخدمت مفاهيم مرتبطة بالوظيفة.' : 'You used role-relevant concepts.', if (answers.any((answer) => answer.length >= 140)) isArabic ? 'قدمت إجابة مفصلة في جزء من المقابلة.' : 'You gave detailed evidence in part of the interview.'], improvements: [isArabic ? 'استخدم أسلوب STAR: الموقف، المهمة، الإجراء، والنتيجة.' : 'Use STAR: situation, task, action, and result.', if (keywordHits < answers.length) isArabic ? 'اربط كل إجابة بمهارات ومتطلبات الوظيفة.' : 'Connect each answer to the role requirements.', if (answers.any((answer) => answer.length < 100)) isArabic ? 'أضف أمثلة ونتائج قابلة للقياس إلى الإجابات القصيرة.' : 'Add examples and measurable results to short answers.'], completedAt: DateTime.now(), usedRemoteAi: false);
  }
}
