import 'practice_tracking_stub.dart'
    if (dart.library.js_interop) 'practice_tracking_web.dart' as implementation;

/// Counts practice sessions without sending answers, scores or CV data.
class PracticeTracking {
  static void started() => implementation.track('practice_started');
  static void completed() => implementation.track('practice_completed');
}
