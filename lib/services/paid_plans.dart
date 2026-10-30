import 'paid_plans_stub.dart'
    if (dart.library.js_interop) 'paid_plans_web.dart' as implementation;

class PaidPlans {
  static bool get available => implementation.available;
  static void openHome(String language) {
    const supported = ['english', 'arabic', 'french', 'spanish', 'german'];
    final selected = supported.contains(language) ? language : 'english';
    implementation.open(Uri.https('mostaedcoach.com', '/', {'lang': selected}).toString());
  }
  static void open(String language) {
    const supported = ['english', 'arabic', 'french', 'spanish', 'german'];
    final selected = supported.contains(language) ? language : 'english';
    final url = Uri.https('mostaedcoach.com', '/', {
      'lang': selected,
      'utm_source': 'free_practice',
      'utm_medium': 'app',
      'utm_campaign': 'practice_result',
    }).replace(fragment: 'pricing');
    implementation.open(url.toString());
  }
}
