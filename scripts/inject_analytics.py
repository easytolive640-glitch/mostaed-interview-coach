"""Add an optional Google Analytics tag to Flutter's generated web shell.

MOSTAED_GA4_ID is a public GA4 web measurement ID, not an API secret.
The event bridge is present even when the ID is unset, so beta builds run safely.
"""
import os
import re
from pathlib import Path

measurement_id = os.environ.get("MOSTAED_GA4_ID", "").strip()
if measurement_id and not re.fullmatch(r"G-[A-Z0-9]+", measurement_id):
    raise SystemExit("MOSTAED_GA4_ID must be a GA4 web measurement ID starting with G-")

index = Path("web/index.html")
html = index.read_text(encoding="utf-8")
if html.count("</head>") != 1:
    raise SystemExit("Expected one </head> in the generated Flutter web/index.html")

if measurement_id:
    tag = f"""<script async src="https://www.googletagmanager.com/gtag/js?id={measurement_id}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag() {{ dataLayer.push(arguments); }}
  gtag('js', new Date());
  gtag('set', 'linker', {{domains: ['mostaed-interview-coach.vercel.app', 'easytolive640-glitch.github.io']}});
  const config = {{page_location: location.origin + location.pathname, page_referrer: document.referrer ? new URL(document.referrer).origin : '', allow_google_signals: false, allow_ad_personalization_signals: false}};
  const campaign = new URL(location.href).searchParams;
  for (const [key, param] of [['campaign_source','utm_source'],['campaign_medium','utm_medium'],['campaign_name','utm_campaign'],['campaign_content','utm_content']]) {{
    const value = campaign.get(param);
    if (value && /^[a-zA-Z0-9_-]{{1,80}}$/.test(value)) config[key] = value;
  }}
  gtag('config', '{measurement_id}', config);
  window.mostaedTrack = function (eventName) {{ gtag('event', eventName); }};
</script>"""
else:
    tag = "<script>window.mostaedTrack = function () {};</script>"
    print("MOSTAED_GA4_ID is unset; practice tracking is disabled.")

index.write_text(html.replace("</head>", tag + "\n</head>", 1), encoding="utf-8")
