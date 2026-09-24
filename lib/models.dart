import 'package:flutter/material.dart';

enum AppLanguage { arabic, english }
enum InterviewCategory { hr, customerService, itCloud }

extension InterviewCategoryUi on InterviewCategory {
  String label(AppLanguage language) => switch ((this, language)) {
        (InterviewCategory.hr, AppLanguage.arabic) => 'الموارد البشرية',
        (InterviewCategory.hr, AppLanguage.english) => 'Human resources',
        (InterviewCategory.customerService, AppLanguage.arabic) => 'خدمة العملاء',
        (InterviewCategory.customerService, AppLanguage.english) => 'Customer service',
        (InterviewCategory.itCloud, AppLanguage.arabic) => 'الدعم الفني والسحابة',
        (InterviewCategory.itCloud, AppLanguage.english) => 'IT support and cloud',
      };

  IconData get icon => switch (this) {
        InterviewCategory.hr => Icons.people_alt_outlined,
        InterviewCategory.customerService => Icons.headset_mic_outlined,
        InterviewCategory.itCloud => Icons.cloud_outlined,
      };
}

class InterviewQuestion {
  const InterviewQuestion({required this.id, required this.arabic, required this.english, required this.keywords});
  final String id;
  final String arabic;
  final String english;
  final List<String> keywords;
  String text(AppLanguage language) => language == AppLanguage.arabic ? arabic : english;
}

class InterviewResult {
  const InterviewResult({required this.category, required this.language, required this.score, required this.strengths, required this.improvements, required this.completedAt, required this.usedRemoteAi});
  final InterviewCategory category;
  final AppLanguage language;
  final int score;
  final List<String> strengths;
  final List<String> improvements;
  final DateTime completedAt;
  final bool usedRemoteAi;

  Map<String, dynamic> toJson() => {'category': category.name, 'language': language.name, 'score': score, 'strengths': strengths, 'improvements': improvements, 'completedAt': completedAt.toIso8601String(), 'usedRemoteAi': usedRemoteAi};

  factory InterviewResult.fromJson(Map<String, dynamic> json) => InterviewResult(
        category: InterviewCategory.values.byName(json['category'] as String),
        language: AppLanguage.values.byName(json['language'] as String),
        score: json['score'] as int,
        strengths: List<String>.from(json['strengths'] as List),
        improvements: List<String>.from(json['improvements'] as List),
        completedAt: DateTime.parse(json['completedAt'] as String),
        usedRemoteAi: json['usedRemoteAi'] as bool? ?? false,
      );
}
