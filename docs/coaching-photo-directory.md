# Coach directory and profile photos

Run docs/coaching-photos.sql after the credentials migration. Optional JPEG/PNG profile photos are limited to 300 KB and stored in a private bucket. The public image endpoint reads an image only after querying the coach with status=approved. Pending photos can be previewed with a 60-second signed link by their owner or the verified administrator; public visitors cannot read them. CVs stay private independently of profile approval.

Successful coach registration and credential saves redirect to the homepage career-coaching section, which shows a one-time submission confirmation. The homepage and coaching directory both consume the server's approved-only profile projection and show a photo (or initial avatar), short biography, specialities, languages and session price. No coach is automatically approved. Existing pending applicants can retain their saved CV while editing LinkedIn or adding an optional photo.
