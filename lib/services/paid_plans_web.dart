import 'dart:js_interop';

const available = true;
@JS('window.location.assign')
external void _navigate(JSString url);
void open(String url) => _navigate(url.toJS);
