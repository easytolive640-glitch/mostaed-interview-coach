import 'dart:js_interop';

@JS('mostaedTrack')
external void _mostaedTrack(JSString event);

void track(String event) => _mostaedTrack(event.toJS);
