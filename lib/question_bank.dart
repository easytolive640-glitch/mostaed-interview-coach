import 'level_questions.dart';
import 'models.dart';

enum PaidPlan { starter, pro }

class QuestionBank {
  static List<InterviewQuestion> forCategory(InterviewCategory category, {DateTime? asOf, String? level}) =>
      level != null ? List.unmodifiable(levelQuestions[category]![level]!) : forPaidCategory(category, PaidPlan.pro, asOf: asOf).take(5).toList(growable: false);

  /// Select once at session start and retain this list throughout the interview.
  /// [asOf] lets callers preview a calendar month and keeps the selection testable.
  static List<InterviewQuestion> forPaidCategory(
    InterviewCategory category,
    PaidPlan plan, {
    DateTime? asOf,
  }) {
    final all = _questions[category]!;
    final date = (asOf ?? DateTime.now()).toUtc();
    final pool = all;
    final offset = ((date.year * 12 + date.month) * 5) % pool.length;
    final count = plan == PaidPlan.starter ? 10 : 15;
    return List.unmodifiable([
      for (var i = 0; i < count; i++) pool[(offset + i) % pool.length],
    ]);
  }

  static const _questions = <InterviewCategory, List<InterviewQuestion>>{
    InterviewCategory.hr: [
      InterviewQuestion(id: 'hr_1', arabic: 'حدثني عن نفسك وخبراتك المهنية.', english: 'Tell me about yourself and your professional experience.', keywords: ['experience', 'skills', 'خبرة', 'مهارات']),
      InterviewQuestion(id: 'hr_2', arabic: 'لماذا تريد هذه الوظيفة؟', english: 'Why do you want this role?', keywords: ['role', 'company', 'value', 'وظيفة', 'شركة', 'قيمة']),
      InterviewQuestion(id: 'hr_3', arabic: 'اذكر نقطة قوة مع مثال عملي.', english: 'Describe a strength with a practical example.', keywords: ['example', 'result', 'مثال', 'نتيجة']),
      InterviewQuestion(id: 'hr_4', arabic: 'احكِ عن تحدٍ وكيف تعاملت معه.', english: 'Tell me about a challenge and how you handled it.', keywords: ['challenge', 'action', 'result', 'تحدي', 'تصرف', 'نتيجة']),
      InterviewQuestion(id: 'hr_5', arabic: 'أين ترى نفسك خلال ثلاث سنوات؟', english: 'Where do you see yourself in three years?', keywords: ['learn', 'grow', 'goal', 'تعلم', 'تطور', 'هدف']),
      InterviewQuestion(id: 'hr_6', arabic: 'صف ملاحظات نقدية تلقيتها. كيف استوضحتها وغيرت أسلوبك وتحققت من تحسن أدائك؟', english: 'Describe critical feedback you received. How did you clarify it, change your approach, and check whether you improved?', keywords: ['feedback', 'clarify', 'improve', 'ملاحظات', 'توضيح', 'تحسين']),
      InterviewQuestion(id: 'hr_7', arabic: 'تم تقديم موعدي تسليم في الوقت نفسه. كيف تعيد ترتيب العمل وتؤكد الالتزامات المعدلة مع المعنيين؟', english: 'Two deadlines move forward at once. How would you reprioritize work and confirm the revised commitments with those affected?', keywords: ['priority', 'communicate', 'confirm', 'أولوية', 'تواصل', 'تأكيد']),
      InterviewQuestion(id: 'hr_8', arabic: 'احكِ عن تعاونك مع شخص تختلف معه في الرأي.', english: 'Tell me about collaborating with someone you disagreed with.', keywords: ['listen', 'agree', 'outcome', 'استماع', 'اتفاق', 'نتيجة']),
      InterviewQuestion(id: 'hr_9', arabic: 'ما الإنجاز الذي تفخر به وما دورك المحدد فيه؟', english: 'Which achievement are you proud of, and what exactly was your role?', keywords: ['action', 'impact', 'measure', 'إجراء', 'أثر', 'قياس']),
      InterviewQuestion(id: 'hr_10', arabic: 'كيف تتعامل مع مهمة جديدة لا تعرف كيف تبدأها؟', english: 'How do you approach an unfamiliar task?', keywords: ['research', 'ask', 'plan', 'بحث', 'سؤال', 'خطة']),
      InterviewQuestion(id: 'hr_11', arabic: 'صف قراراً اتخذته تحت ضغط وما الذي تعلمته.', english: 'Describe a decision you made under pressure and what you learned.', keywords: ['decision', 'tradeoff', 'learn', 'قرار', 'موازنة', 'تعلم']),
      InterviewQuestion(id: 'hr_12', arabic: 'كيف تشرح فترة انتقال أو فجوة في مسارك المهني؟', english: 'How would you explain a career transition or gap?', keywords: ['context', 'skills', 'future', 'سياق', 'مهارات', 'مستقبل']),
      InterviewQuestion(id: 'hr_13', arabic: 'كيف تعرف أنك نجحت في أول ثلاثة أشهر في الوظيفة؟', english: 'How would you know you succeeded in your first three months?', keywords: ['goal', 'measure', 'feedback', 'هدف', 'قياس', 'ملاحظات']),
      InterviewQuestion(id: 'hr_14', arabic: 'احكِ عن موقف تعلمت فيه مهارة بسرعة لتلبية حاجة العمل.', english: 'Tell me about learning a skill quickly to meet a work need.', keywords: ['learn', 'practice', 'result', 'تعلم', 'تطبيق', 'نتيجة']),
      InterviewQuestion(id: 'hr_15', arabic: 'ما الأسئلة التي ستطرحها على الفريق قبل قبول الدور؟', english: 'What would you ask the team before accepting the role?', keywords: ['team', 'success', 'expectations', 'فريق', 'نجاح', 'توقعات']),
      InterviewQuestion(id: 'hr_16', arabic: 'كيف تتعامل مع تغيير متطلبات الدور بعد بدء العمل؟', english: 'How do you adapt when the expectations of your role change?', keywords: ['adapt', 'clarify', 'priority', 'تكيف', 'توضيح', 'أولوية']),
      InterviewQuestion(id: 'hr_17', arabic: 'صف موقفاً ساعدت فيه زميلاً على تحقيق هدف مشترك.', english: 'Describe helping a colleague reach a shared goal.', keywords: ['support', 'team', 'result', 'دعم', 'فريق', 'نتيجة']),
      InterviewQuestion(id: 'hr_18', arabic: 'اختر إنجازاً مهنياً. كيف تشرح مساهمتك وتدعم النتيجة بمقاييس مناسبة أو أدلة أخرى؟', english: 'Choose a work achievement. How would you explain your contribution and support the outcome with relevant measures or other evidence?', keywords: ['contribution', 'evidence', 'measure', 'مساهمة', 'دليل', 'قياس']),
      InterviewQuestion(id: 'hr_19', arabic: 'صف كيف استوضحت احتياجات أحد أصحاب المصلحة. ما الملاحظات التي غيرت فهمك وكيف أكدت النتيجة المتفق عليها؟', english: 'Describe how you clarified a stakeholder’s needs. What feedback changed your understanding, and how did you confirm the agreed outcome?', keywords: ['listen', 'feedback', 'confirm', 'استماع', 'ملاحظات', 'تأكيد']),
      InterviewQuestion(id: 'hr_20', arabic: 'كيف توازن بين سرعة الإنجاز وجودة العمل؟', english: 'How do you balance delivery speed and quality?', keywords: ['priority', 'quality', 'tradeoff', 'أولوية', 'جودة', 'موازنة']),
    ],
    InterviewCategory.customerService: [
      InterviewQuestion(id: 'cs_1', arabic: 'كيف تتعامل مع عميل غاضب؟', english: 'How do you handle an angry customer?', keywords: ['listen', 'empathy', 'solution', 'استماع', 'تعاطف', 'حل']),
      InterviewQuestion(id: 'cs_2', arabic: 'اذكر موقفاً حوّلت فيه تجربة سيئة إلى إيجابية.', english: 'Describe turning a bad customer experience into a positive one.', keywords: ['situation', 'action', 'result', 'موقف', 'إجراء', 'نتيجة']),
      InterviewQuestion(id: 'cs_3', arabic: 'كيف تتعامل مع عدة طلبات في الوقت نفسه؟', english: 'How do you manage several requests at once?', keywords: ['priority', 'urgent', 'communicate', 'أولوية', 'عاجل', 'تواصل']),
      InterviewQuestion(id: 'cs_4', arabic: 'يسأل عميل عن أمر لا تستطيع التحقق منه. كيف تبحث عن إجابة موثوقة وترتب التحويل إلى موظف دون أن يكرر العميل مشكلته؟', english: 'A customer asks something you cannot verify. How would you seek a reliable answer and arrange a human handoff without making the customer repeat the issue?', keywords: ['verify', 'handoff', 'context', 'تحقق', 'تحويل', 'سياق']),
      InterviewQuestion(id: 'cs_5', arabic: 'كيف تقيس جودة خدمة العملاء؟', english: 'How do you measure customer-service quality?', keywords: ['satisfaction', 'resolution', 'feedback', 'رضا', 'حل', 'ملاحظات']),
      InterviewQuestion(id: 'cs_6', arabic: 'كيف تتحقق من فهمك لمشكلة العميل قبل اقتراح حل؟', english: 'How do you confirm you understand a customer issue before proposing a fix?', keywords: ['listen', 'clarify', 'confirm', 'استماع', 'توضيح', 'تأكيد']),
      InterviewQuestion(id: 'cs_7', arabic: 'صف مشكلة صعّدتها إلى فريق آخر. كيف قررت التصعيد ونقلت السياق وتابعت مع العميل؟', english: 'Describe an issue you escalated to another team. How did you decide to escalate, pass on the context, and follow up with the customer?', keywords: ['escalate', 'context', 'follow up', 'تصعيد', 'سياق', 'متابعة']),
      InterviewQuestion(id: 'cs_8', arabic: 'ماذا تفعل إذا طلب العميل شيئاً يخالف سياسة الشركة؟', english: 'What do you do if a customer asks for something against policy?', keywords: ['policy', 'empathy', 'alternative', 'سياسة', 'تعاطف', 'بديل']),
      InterviewQuestion(id: 'cs_9', arabic: 'كيف تتعامل مع تكرار شكوى لا تملك صلاحية حل سببها؟', english: 'How do you handle a recurring complaint you cannot resolve yourself?', keywords: ['document', 'escalate', 'update', 'توثيق', 'تصعيد', 'تحديث']),
      InterviewQuestion(id: 'cs_10', arabic: 'صف طريقة شرحك حلاً تقنياً لعميل غير متخصص.', english: 'How would you explain a technical solution to a nontechnical customer?', keywords: ['simple', 'steps', 'confirm', 'بسيط', 'خطوات', 'تأكيد']),
      InterviewQuestion(id: 'cs_11', arabic: 'كيف تهدئ مكالمة أصبحت متوترة دون تقديم وعد غير مؤكد؟', english: 'How do you calm a tense call without making an uncertain promise?', keywords: ['calm', 'honest', 'next step', 'هدوء', 'صراحة', 'خطوة']),
      InterviewQuestion(id: 'cs_12', arabic: 'ما المعلومات التي توثقها بعد حل تذكرة دعم؟', english: 'What information do you document after resolving a support ticket?', keywords: ['cause', 'action', 'resolution', 'سبب', 'إجراء', 'حل']),
      InterviewQuestion(id: 'cs_13', arabic: 'كيف توازن بين سرعة الرد وجودة الحل؟', english: 'How do you balance response speed with solution quality?', keywords: ['priority', 'accuracy', 'metric', 'أولوية', 'دقة', 'مؤشر']),
      InterviewQuestion(id: 'cs_14', arabic: 'صف موقفاً استخدمت فيه ملاحظات العملاء لتحسين العملية.', english: 'Describe using customer feedback to improve a process.', keywords: ['feedback', 'change', 'result', 'ملاحظات', 'تحسين', 'نتيجة']),
      InterviewQuestion(id: 'cs_15', arabic: 'كيف تتعامل مع عميل يعود بعد أن لم يحل طلبه من المرة الأولى؟', english: 'How do you handle a returning customer whose issue was not solved the first time?', keywords: ['history', 'ownership', 'follow up', 'سجل', 'مسؤولية', 'متابعة']),
      InterviewQuestion(id: 'cs_16', arabic: 'كيف تتعامل مع طلب عميل عبر أكثر من قناة دون تكرار العمل؟', english: 'How do you handle a customer request across multiple channels without duplicating work?', keywords: ['history', 'handoff', 'confirm', 'سجل', 'تسليم', 'تأكيد']),
      InterviewQuestion(id: 'cs_17', arabic: 'تقدم مسودة ذكاء اصطناعي إجابة للعميل لا تستطيع تأكيدها. كيف تراجع الإرشادات المعتمدة وتقرر تصحيحها أو تصعيدها قبل الإرسال؟', english: 'An AI draft gives a customer an answer you cannot confirm. How would you check approved guidance and decide whether to correct it or escalate before sending?', keywords: ['verify', 'policy', 'escalate', 'تحقق', 'سياسة', 'تصعيد']),
      InterviewQuestion(id: 'cs_18', arabic: 'يرسل عميل بيانات حساسة في محادثة دعم. كيف تحد من جمعها ومشاركتها والوصول إليها أثناء حل المشكلة وفق سياسة الشركة؟', english: 'A customer includes sensitive data in a support conversation. How would you limit its collection, sharing, and access while resolving the issue under company policy?', keywords: ['privacy', 'minimize', 'access', 'خصوصية', 'تقليل', 'وصول']),
      InterviewQuestion(id: 'cs_19', arabic: 'ماذا تقول للعميل إذا تأخر حل المشكلة أكثر من المتوقع؟', english: 'What do you tell a customer when resolution takes longer than expected?', keywords: ['update', 'honest', 'next step', 'تحديث', 'صراحة', 'خطوة']),
      InterviewQuestion(id: 'cs_20', arabic: 'كيف تحدد ما إذا كان حل التذكرة قد عالج السبب الأصلي؟', english: 'How do you determine whether a ticket resolution addressed the original cause?', keywords: ['confirm', 'cause', 'follow up', 'تأكيد', 'سبب', 'متابعة']),
    ],
    InterviewCategory.itCloud: [
      InterviewQuestion(id: 'it_1', arabic: 'اشرح الفرق بين التوافر العالي والتعافي من الكوارث.', english: 'Explain high availability versus disaster recovery.', keywords: ['availability', 'recovery', 'rto', 'rpo', 'توافر', 'تعافي']),
      InterviewQuestion(id: 'it_2', arabic: 'كيف تبدأ تشخيص انقطاع خدمة سحابية؟', english: 'How do you start diagnosing a cloud-service outage?', keywords: ['monitoring', 'logs', 'network', 'مراقبة', 'سجلات', 'شبكة']),
      InterviewQuestion(id: 'it_3', arabic: 'تملك خدمة صلاحيات أوسع مما تحتاج. اشرح مبدأ أقل الصلاحيات وكيف تستخدم أدلة الوصول لتقليل الصلاحيات بأمان بمرور الوقت.', english: 'A service has broader permissions than it needs. Explain least privilege and how you would use access evidence to reduce permissions safely over time.', keywords: ['permission', 'evidence', 'review', 'صلاحية', 'دليل', 'مراجعة']),
      InterviewQuestion(id: 'it_4', arabic: 'كيف تنفذ تحليلاً للسبب الجذري؟', english: 'How do you perform root-cause analysis?', keywords: ['timeline', 'evidence', 'cause', 'منهج', 'دليل', 'سبب']),
      InterviewQuestion(id: 'it_5', arabic: 'كيف تؤمّن تطبيقاً يعمل على السحابة؟', english: 'How do you secure a cloud-hosted application?', keywords: ['identity', 'encryption', 'monitoring', 'هوية', 'تشفير', 'مراقبة']),
      InterviewQuestion(id: 'it_6', arabic: 'كيف تتحقق مما إذا كانت المشكلة في DNS أم الشبكة أم التطبيق؟', english: 'How do you distinguish a DNS issue from a network or application issue?', keywords: ['dns', 'connectivity', 'logs', 'نطاق', 'اتصال', 'سجلات']),
      InterviewQuestion(id: 'it_7', arabic: 'اشرح كيف تختبر استعادة نسخة احتياطية.', english: 'How do you test restoring a backup?', keywords: ['restore', 'verify', 'rpo', 'استعادة', 'تحقق', 'نسخة']),
      InterviewQuestion(id: 'it_8', arabic: 'كيف تتعامل مع تنبيه استخدام مرتفع للمعالج في خدمة إنتاج؟', english: 'How do you respond to high CPU usage in a production service?', keywords: ['metric', 'logs', 'mitigate', 'مؤشر', 'سجلات', 'احتواء']),
      InterviewQuestion(id: 'it_9', arabic: 'ما خطوات نشر تغيير باستخدام خط CI/CD مع تقليل المخاطر؟', english: 'How would you deploy a change through CI/CD while limiting risk?', keywords: ['test', 'rollback', 'monitor', 'اختبار', 'تراجع', 'مراقبة']),
      InterviewQuestion(id: 'it_10', arabic: 'كيف تشرح الفرق بين حاوية Docker وآلة افتراضية؟', english: 'How do you explain the difference between a Docker container and a virtual machine?', keywords: ['kernel', 'isolation', 'resource', 'نواة', 'عزل', 'موارد']),
      InterviewQuestion(id: 'it_11', arabic: 'كيف تتحقق من سبب تعذر وصول تطبيق إلى قاعدة بيانات؟', english: 'How do you diagnose an application failing to reach a database?', keywords: ['dns', 'firewall', 'credentials', 'نطاق', 'جدار', 'اعتماد']),
      InterviewQuestion(id: 'it_12', arabic: 'اشرح متى تستخدم التوسع الأفقي بدلاً من التوسع الرأسي.', english: 'When would you choose horizontal scaling instead of vertical scaling?', keywords: ['load', 'availability', 'cost', 'حمل', 'توافر', 'تكلفة']),
      InterviewQuestion(id: 'it_13', arabic: 'كيف تدير سراً مستخدماً في خط نشر دون كشفه في السجلات؟', english: 'How do you handle a deployment secret without exposing it in logs?', keywords: ['vault', 'permission', 'rotate', 'خزنة', 'صلاحية', 'تدوير']),
      InterviewQuestion(id: 'it_14', arabic: 'يؤثر انقطاع سحابي إقليمي في بيئة الإنتاج. كيف تنسق أدوار الاستجابة وإجراءات التعافي وتحديثات أصحاب المصلحة باستخدام خطة الحوادث؟', english: 'A regional cloud outage affects production. How would you coordinate response roles, recovery actions, and stakeholder updates using the incident plan?', keywords: ['incident', 'role', 'communicate', 'حادث', 'دور', 'تواصل']),
      InterviewQuestion(id: 'it_15', arabic: 'كيف تنفذ تمرين تعافٍ من الكوارث بحدود أمان واضحة وتختبر الوصول الطارئ وتحدث دليل الإجراءات دون تعطيل المستخدمين؟', english: 'How would you run a disaster recovery drill with clear safety limits, test emergency access, and update the runbook without disrupting users?', keywords: ['drill', 'access', 'runbook', 'تمرين', 'وصول', 'إجراءات']),
      InterviewQuestion(id: 'it_16', arabic: 'قبل نشر خدمة جديدة، كيف تتحقق من أن سياسة الوصول تسمح بالإجراءات المطلوبة وتمنع الإجراءات غير الضرورية؟', english: 'Before deploying a new service, how would you verify that its access policy allows required actions and denies unnecessary ones?', keywords: ['policy', 'allow', 'deny', 'سياسة', 'سماح', 'منع']),
      InterviewQuestion(id: 'it_17', arabic: 'كيف تحقق في ارتفاع مفاجئ في تكلفة البنية السحابية؟', english: 'How do you investigate a sudden increase in cloud infrastructure cost?', keywords: ['usage', 'metric', 'budget', 'استخدام', 'مؤشر', 'ميزانية']),
      InterviewQuestion(id: 'it_18', arabic: 'كيف تراجع تغييراً أنشأته أداة ذكاء اصطناعي قبل نشره؟', english: 'How do you review an AI generated infrastructure change before deployment?', keywords: ['review', 'test', 'security', 'مراجعة', 'اختبار', 'أمان']),
      InterviewQuestion(id: 'it_19', arabic: 'ما خطتك لاحتواء تسريب بيانات اعتماد خدمة؟', english: 'What is your plan to contain leaked service credentials?', keywords: ['revoke', 'rotate', 'audit', 'إلغاء', 'تدوير', 'تدقيق']),
      InterviewQuestion(id: 'it_20', arabic: 'كيف تراقب مستوى الخدمة بعد نشر تغيير جديد؟', english: 'How do you monitor service health after a new deployment?', keywords: ['metric', 'alert', 'rollback', 'مؤشر', 'تنبيه', 'تراجع']),
    ],
  };
}
