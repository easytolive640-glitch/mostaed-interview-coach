import 'package:flutter/material.dart';

import 'models.dart';
import 'question_bank.dart';
import 'services/evaluation_service.dart';
import 'services/history_service.dart';

void main() => runApp(const MostaedApp());

class MostaedApp extends StatelessWidget {
  const MostaedApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Mostaed',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF6750A4)),
        useMaterial3: true,
      ),
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  AppLanguage language = AppLanguage.arabic;
  bool get isArabic => language == AppLanguage.arabic;

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: isArabic ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        appBar: AppBar(
          title: Text(isArabic ? 'مستعد' : 'Mostaed'),
          actions: [
            IconButton(
              tooltip: isArabic ? 'السجل' : 'History',
              icon: const Icon(Icons.history),
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => HistoryScreen(language: language),
                ),
              ),
            ),
          ],
        ),
        body: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            SegmentedButton<AppLanguage>(
              segments: const [
                ButtonSegment(value: AppLanguage.arabic, label: Text('العربية')),
                ButtonSegment(value: AppLanguage.english, label: Text('English')),
              ],
              selected: {language},
              onSelectionChanged: (selection) =>
                  setState(() => language = selection.first),
            ),
            const SizedBox(height: 24),
            Text(
              isArabic
                  ? 'تدرّب. تحسّن. احصل على الوظيفة.'
                  : 'Practice. Improve. Get the job.',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 8),
            Text(isArabic
                ? 'اختر نوع المقابلة وابدأ تدريباً عملياً.'
                : 'Choose a role and start a practical interview.'),
            const SizedBox(height: 24),
            for (final category in InterviewCategory.values)
              Card(
                child: ListTile(
                  leading: Icon(category.icon),
                  title: Text(category.label(language)),
                  subtitle: Text(isArabic ? '5 أسئلة تدريبية' : '5 practice questions'),
                  trailing: Icon(isArabic
                      ? Icons.arrow_back_ios_new
                      : Icons.arrow_forward_ios),
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => InterviewScreen(
                        category: category,
                        language: language,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class InterviewScreen extends StatefulWidget {
  const InterviewScreen({
    super.key,
    required this.category,
    required this.language,
  });
  final InterviewCategory category;
  final AppLanguage language;

  @override
  State<InterviewScreen> createState() => _InterviewScreenState();
}

class _InterviewScreenState extends State<InterviewScreen> {
  final controller = TextEditingController();
  final answers = <String>[];
  int index = 0;
  bool submitting = false;

  bool get isArabic => widget.language == AppLanguage.arabic;
  List<InterviewQuestion> get interviewQuestions =>
      QuestionBank.forCategory(widget.category);

  @override
  void initState() {
    super.initState();
    controller.addListener(_refreshAnswerState);
  }

  void _refreshAnswerState() => setState(() {});

  @override
  void dispose() {
    controller.removeListener(_refreshAnswerState);
    controller.dispose();
    super.dispose();
  }

  Future<void> submit() async {
    if (!mounted) return;
    if (controller.text.trim().length < 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(isArabic
              ? 'اكتب إجابة أوضح قبل المتابعة.'
              : 'Write a clearer answer before continuing.'),
        ),
      );
      return;
    }
    answers.add(controller.text.trim());
    controller.clear();
    if (index < interviewQuestions.length - 1) {
      setState(() => index++);
      return;
    }
    setState(() => submitting = true);
    final result = await EvaluationService().evaluate(
      category: widget.category,
      language: widget.language,
      questions: interviewQuestions,
      answers: answers,
    );
    await HistoryService.save(result);
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => ResultScreen(result: result)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final question = interviewQuestions[index];
    final progress = (index + 1) / interviewQuestions.length;
    final answerLength = controller.text.trim().length;
    return Directionality(
      textDirection: isArabic ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: const Color(0xFF0B0830),
        appBar: AppBar(
          foregroundColor: Colors.white,
          backgroundColor: Colors.transparent,
          elevation: 0,
          title: Text(widget.category.label(widget.language),
              style: const TextStyle(fontWeight: FontWeight.w800)),
          actions: [
            Padding(
              padding: const EdgeInsetsDirectional.only(end: 16),
              child: Chip(
                avatar: const Icon(Icons.auto_awesome,
                    size: 17, color: Color(0xFFFFD45C)),
                label: Text(isArabic ? 'وضع التدريب' : 'Practice mode'),
                backgroundColor: const Color(0xFF2A175B),
                labelStyle: const TextStyle(color: Colors.white),
                side: const BorderSide(color: Color(0xFF7148B7)),
              ),
            ),
          ],
        ),
        body: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF0B0830), Color(0xFF201052), Color(0xFF10103A)],
            ),
          ),
          child: SafeArea(
            top: false,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
              children: [
                Row(
                  children: [
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(20),
                        child: LinearProgressIndicator(
                          value: progress,
                          minHeight: 10,
                          backgroundColor: Colors.white12,
                          valueColor: const AlwaysStoppedAnimation(Color(0xFF56F2C3)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text('${(progress * 100).round()}%',
                        style: const TextStyle(
                            color: Color(0xFF56F2C3),
                            fontWeight: FontWeight.w800)),
                  ],
                ),
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.all(22),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF7438C9), Color(0xFFC43C92), Color(0xFFE76A4F)],
                    ),
                    borderRadius: BorderRadius.circular(26),
                    boxShadow: const [
                      BoxShadow(color: Color(0x553A0A5E), blurRadius: 30, offset: Offset(0, 16)),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: .16),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          isArabic
                              ? 'السؤال ${index + 1} من ${interviewQuestions.length}'
                              : 'Question ${index + 1} of ${interviewQuestions.length}',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                        ),
                      ),
                      const SizedBox(height: 18),
                      Text(
                        question.text(widget.language),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          height: 1.35,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(15),
                  decoration: BoxDecoration(
                    color: const Color(0xFF171548),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: const Color(0xFF3C3974)),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.tips_and_updates_outlined,
                          color: Color(0xFFFFD45C)),
                      const SizedBox(width: 11),
                      Expanded(
                        child: Text(
                          isArabic
                              ? 'نصيحة: نظّم إجابتك إلى موقف، مهمة، إجراء، ونتيجة قابلة للقياس.'
                              : 'Tip: structure your answer with a situation, task, action, and measurable result.',
                          style: const TextStyle(color: Color(0xFFD8D4ED), height: 1.45),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                const SizedBox(height: 16),
                TextField(
                  controller: controller,
                  minLines: 7,
                  maxLines: 12,
                  enabled: !submitting,
                  style: const TextStyle(color: Colors.white, fontSize: 16, height: 1.5),
                  decoration: InputDecoration(
                    filled: true,
                    fillColor: const Color(0xFF121039),
                    hintStyle: const TextStyle(color: Color(0xFF8F8AAE)),
                    hintText: isArabic
                        ? 'اكتب إجابتك مع مثال عملي ونتيجة واضحة…'
                        : 'Write your answer with a practical example and clear result…',
                    contentPadding: const EdgeInsets.all(20),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(22),
                      borderSide: const BorderSide(color: Color(0xFF403A77)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(22),
                      borderSide: const BorderSide(color: Color(0xFF403A77)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(22),
                      borderSide: const BorderSide(color: Color(0xFF56F2C3), width: 2),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  child: Text(
                    isArabic
                        ? '$answerLength حرفاً · يفضّل 100 حرف على الأقل'
                        : '$answerLength characters · aim for at least 100',
                    style: TextStyle(
                      color: answerLength >= 100
                          ? const Color(0xFF56F2C3)
                          : const Color(0xFFAAA5C6),
                      fontSize: 13,
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                SizedBox(
                  height: 56,
                  child: FilledButton.icon(
                    style: FilledButton.styleFrom(
                      foregroundColor: const Color(0xFF28113E),
                      backgroundColor: const Color(0xFFFFD45C),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(17)),
                      textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
                    ),
                    onPressed: submitting ? null : submit,
                    icon: submitting
                        ? const SizedBox.square(
                            dimension: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Icon(index == interviewQuestions.length - 1
                            ? Icons.insights_rounded
                            : (isArabic ? Icons.arrow_back_rounded : Icons.arrow_forward_rounded)),
                    label: Text(submitting
                        ? (isArabic ? 'جارٍ التقييم…' : 'Evaluating…')
                        : index == interviewQuestions.length - 1
                            ? (isArabic ? 'عرض التقييم' : 'View evaluation')
                            : (isArabic ? 'السؤال التالي' : 'Next question')),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class ResultScreen extends StatelessWidget {
  const ResultScreen({super.key, required this.result});
  final InterviewResult result;

  @override
  Widget build(BuildContext context) {
    final isArabic = result.language == AppLanguage.arabic;
    return Directionality(
      textDirection: isArabic ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        appBar: AppBar(title: Text(isArabic ? 'نتيجة التدريب' : 'Interview result')),
        body: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            const Icon(Icons.workspace_premium_outlined, size: 72),
            Text('${result.score}/100',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.displaySmall),
            const SizedBox(height: 12),
            Chip(
              avatar: Icon(result.usedRemoteAi ? Icons.auto_awesome : Icons.offline_bolt),
              label: Text(result.usedRemoteAi
                  ? (isArabic ? 'تقييم ذكي آمن' : 'Secure AI evaluation')
                  : (isArabic ? 'تقييم محلي' : 'On-device evaluation')),
            ),
            const SizedBox(height: 16),
            _FeedbackCard(
              title: isArabic ? 'نقاط القوة' : 'Strengths',
              items: result.strengths,
            ),
            _FeedbackCard(
              title: isArabic ? 'خطوات التحسين' : 'Improvements',
              items: result.improvements,
            ),
            const SizedBox(height: 12),
            FilledButton(
              onPressed: () => Navigator.of(context).popUntil((route) => route.isFirst),
              child: Text(isArabic ? 'تدريب جديد' : 'New practice'),
            ),
          ],
        ),
      ),
    );
  }
}

class _FeedbackCard extends StatelessWidget {
  const _FeedbackCard({required this.title, required this.items});
  final String title;
  final List<String> items;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            for (final item in items)
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Text('• $item'),
              ),
          ],
        ),
      ),
    );
  }
}

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key, required this.language});
  final AppLanguage language;

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  late Future<List<InterviewResult>> history;

  @override
  void initState() {
    super.initState();
    history = HistoryService.load();
  }

  @override
  Widget build(BuildContext context) {
    final isArabic = widget.language == AppLanguage.arabic;
    return Directionality(
      textDirection: isArabic ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        appBar: AppBar(title: Text(isArabic ? 'سجل المقابلات' : 'Interview history')),
        body: FutureBuilder<List<InterviewResult>>(
          future: history,
          builder: (context, snapshot) {
            if (!snapshot.hasData) {
              return const Center(child: CircularProgressIndicator());
            }
            final results = snapshot.data!;
            if (results.isEmpty) {
              return Center(
                child: Text(isArabic
                    ? 'أكمل أول مقابلة لتظهر هنا.'
                    : 'Complete your first interview to see it here.'),
              );
            }
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: results.length,
              itemBuilder: (context, index) {
                final result = results[index];
                return Card(
                  child: ListTile(
                    leading: CircleAvatar(child: Text('${result.score}')),
                    title: Text(result.category.label(widget.language)),
                    subtitle: Text(
                      result.completedAt.toLocal().toString().split('.').first,
                    ),
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => ResultScreen(result: result)),
                    ),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
