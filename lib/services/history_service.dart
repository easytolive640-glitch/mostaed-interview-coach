import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models.dart';

class HistoryService {
  static const _key = 'interview_history_v1';

  static Future<List<InterviewResult>> load() async {
    final preferences = await SharedPreferences.getInstance();
    final encoded = preferences.getStringList(_key) ?? const [];
    return encoded.map((item) => InterviewResult.fromJson(jsonDecode(item) as Map<String, dynamic>)).toList().reversed.toList();
  }

  static Future<void> save(InterviewResult result) async {
    final preferences = await SharedPreferences.getInstance();
    final history = preferences.getStringList(_key) ?? <String>[];
    history.add(jsonEncode(result.toJson()));
    if (history.length > 30) history.removeAt(0);
    await preferences.setStringList(_key, history);
  }
}
