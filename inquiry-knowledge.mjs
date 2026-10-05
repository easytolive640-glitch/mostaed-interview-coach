import {inquiryCopy} from './inquiry-copy.mjs';
export const topics=[
  {
    "id": "free",
    "pattern": "free|start|practice|مجاني|ابدأ|تدريب|gratuit|commencer|gratis|empezar|kostenlos",
    "labels": {
      "en": "What is free?",
      "ar": "ما المتاح مجاناً؟",
      "fr": "Que propose le gratuit ?",
      "es": "¿Qué es gratis?",
      "de": "Was ist kostenlos?"
    },
    "answer": {
      "en": "Free practice has five text questions per session with local scoring. English, Arabic, French, Spanish and German are supported. AI evaluation, voice and CV feedback belong to paid practice.",
      "ar": "يشمل التدريب المجاني خمسة أسئلة كتابية في الجلسة وتقييماً محلياً، بالإنجليزية والعربية والفرنسية والإسبانية والألمانية. تقييم الذكاء الاصطناعي والصوت والسيرة من مزايا التدريب المدفوع.",
      "fr": "L’entraînement gratuit comprend cinq questions écrites par session avec une notation locale, en anglais, arabe, français, espagnol et allemand. L’IA, l’audio et le CV sont des fonctions payantes.",
      "es": "La práctica gratuita incluye cinco preguntas escritas por sesión con puntuación local, en inglés, árabe, francés, español y alemán. La IA, el audio y el CV son funciones de pago.",
      "de": "Die kostenlose Übung umfasst fünf Textfragen pro Sitzung mit lokaler Bewertung auf Englisch, Arabisch, Französisch, Spanisch und Deutsch. KI-, Audio- und Lebenslaufbewertung sind kostenpflichtige Funktionen."
    }
  },
  {
    "id": "pricing",
    "pattern": "pric|cost|plan|subscription|pay|card|سعر|تكلف|اشتراك|دفع|بطاق|باق|prix|tarif|paiement|precio|pago|preis|zahlung|abo",
    "labels": {
      "en": "Plans & pricing",
      "ar": "الباقات والأسعار",
      "fr": "Offres et tarifs",
      "es": "Planes y precios",
      "de": "Tarife und Preise"
    },
    "answer": {
      "en": "Free practice is available. AI Starter is listed at USD 3.99/month, coming soon. AI Pro is listed at USD 7.99/month with up to 100 evaluations. AI access requires verification. Sandbox payments never unlock live AI; live card checkout is still being tested.",
      "ar": "التدريب المجاني متاح. تعرض AI Starter بسعر 3.99 دولار شهرياً وتأتي قريباً. تعرض AI Pro بسعر 7.99 دولار وحتى 100 تقييم شهرياً. يلزم وصول مؤكد للذكاء الاصطناعي. الدفع التجريبي لا يفتح الوصول الحقيقي، والدفع الحقيقي بالبطاقات قيد الاختبار.",
      "fr": "L’entraînement gratuit est disponible. AI Starter : 3,99 USD/mois, prochainement. AI Pro : 7,99 USD/mois, jusqu’à 100 évaluations. L’accès IA doit être vérifié. Les paiements sandbox ne débloquent pas l’IA réelle ; le paiement réel par carte est encore en test.",
      "es": "La práctica gratuita está disponible. AI Starter: 3,99 USD/mes, próximamente. AI Pro: 7,99 USD/mes y hasta 100 evaluaciones. La IA requiere acceso verificado. El sandbox nunca desbloquea IA real; el pago real con tarjeta sigue en pruebas.",
      "de": "Kostenlose Übung ist verfügbar. AI Starter: 3,99 USD/Monat, demnächst. AI Pro: 7,99 USD/Monat mit bis zu 100 Auswertungen. KI-Zugang muss bestätigt sein. Sandbox-Zahlungen schalten keine echte KI frei; echte Kartenzahlungen werden noch getestet."
    }
  },
  {
    "id": "voice",
    "pattern": "voice|audio|cv|resume|صوت|سير[ةه]|voix|voz|lebenslauf|stimme",
    "labels": {
      "en": "Voice & CV",
      "ar": "الصوت والسيرة",
      "fr": "Audio et CV",
      "es": "Audio y CV",
      "de": "Audio und Lebenslauf"
    },
    "answer": {
      "en": "Free practice is text-only. Paid practice has 15 written answers, optional CV text and one optional voice answer. Paste CV text or upload .txt; PDF and Word are not supported here. Audio: WAV, WebM or MP4, up to 2 MB. Consent is required before sending CV or audio. Do not upload them in this chat.",
      "ar": "يتضمن التدريب المدفوع 15 إجابة كتابية وسيرة نصية وإجابة صوتية اختياريتين. الصق السيرة أو ارفع .txt؛ لا يدعم PDF أو Word هنا. الصوت WAV أو WebM أو MP4 حتى 2 ميجابايت. يلزم موافقتك قبل الإرسال. لا ترفعهما في هذه الدردشة.",
      "fr": "L’entraînement payant comprend 15 réponses écrites, un CV texte facultatif et une réponse audio facultative. Collez le CV ou importez .txt ; PDF et Word ne sont pas pris en charge ici. Audio : WAV, WebM ou MP4, 2 Mo maximum. Consentement requis avant l’envoi. Ne les envoyez pas dans ce chat.",
      "es": "La práctica de pago usa 15 respuestas escritas, CV de texto opcional y una respuesta de audio opcional. Pega el CV o sube .txt; aquí no se admite PDF ni Word. Audio: WAV, WebM o MP4 hasta 2 MB. Se requiere consentimiento antes de enviar. No los subas a este chat.",
      "de": "Die kostenpflichtige Übung nutzt 15 Textantworten, optionalen Lebenslauftext und eine optionale Audioantwort. Text einfügen oder .txt hochladen; PDF und Word werden hier nicht unterstützt. Audio: WAV, WebM oder MP4 bis 2 MB. Zustimmung vor dem Senden erforderlich. Nicht in diesen Chat hochladen."
    }
  },
  {
    "id": "roles",
    "pattern": "role|language|hr|cloud|عربي|إنجليزي|مجال|وظيف|لغ[ةه]|langue|français|idioma|español|sprache|deutsch",
    "labels": {
      "en": "Roles & languages",
      "ar": "المجالات واللغات",
      "fr": "Métiers et langues",
      "es": "Puestos e idiomas",
      "de": "Bereiche und Sprachen"
    },
    "answer": {
      "en": "Mostaed supports HR, customer service and IT/cloud practice in English, Arabic, French, Spanish and German. Choose a language in the selector; it carries across app pages. Additional paid questions rotate monthly.",
      "ar": "يدعم مستعد الموارد البشرية وخدمة العملاء وتقنية المعلومات والسحابة بالإنجليزية والعربية والفرنسية والإسبانية والألمانية. اختر اللغة من القائمة وستستمر عبر صفحات التطبيق. تتناوب الأسئلة الإضافية المدفوعة شهرياً.",
      "fr": "Mostaed propose RH, service client et informatique/cloud en anglais, arabe, français, espagnol et allemand. Votre langue sélectionnée vous suit entre les pages. Les questions payantes supplémentaires tournent chaque mois.",
      "es": "Mostaed ofrece RR. HH., atención al cliente e informática/nube en inglés, árabe, francés, español y alemán. El idioma elegido se mantiene entre páginas. Las preguntas adicionales de pago rotan cada mes.",
      "de": "Mostaed bietet Personalwesen, Kundenservice und IT/Cloud auf Englisch, Arabisch, Französisch, Spanisch und Deutsch. Ihre Sprachwahl bleibt über App-Seiten hinweg erhalten. Zusätzliche kostenpflichtige Fragen wechseln monatlich."
    }
  },
  {
    "id": "account",
    "pattern": "account|login|sign|password|حساب|دخول|تسجيل|مرور|compte|connexion|passe|cuenta|sesión|contraseña|konto|anmeld|passwort",
    "labels": {
      "en": "Account help",
      "ar": "مساعدة الحساب",
      "fr": "Aide au compte",
      "es": "Ayuda de cuenta",
      "de": "Kontohilfe"
    },
    "answer": {
      "en": "Use Account to sign in with Google or email. Confirm your email after email registration. Use Forgot password if needed. Never share passwords, codes or payment details here.",
      "ar": "استخدم الحساب للدخول عبر Google أو البريد. أكد بريدك بعد التسجيل بالبريد. استخدم نسيت كلمة المرور عند الحاجة. لا تشارك كلمات المرور أو الرموز أو بيانات الدفع هنا.",
      "fr": "Connectez-vous via Google ou e-mail sur la page Compte. Confirmez votre e-mail après inscription. Utilisez Mot de passe oublié au besoin. Ne partagez ni mots de passe, ni codes, ni données de paiement ici.",
      "es": "Accede con Google o correo en Cuenta. Confirma el correo al registrarte. Usa Olvidé mi contraseña si lo necesitas. No compartas contraseñas, códigos ni datos de pago aquí.",
      "de": "Melden Sie sich mit Google oder E-Mail auf der Kontoseite an. Bestätigen Sie Ihre E-Mail nach Registrierung. Nutzen Sie bei Bedarf Passwort vergessen. Teilen Sie hier keine Passwörter, Codes oder Zahlungsdaten."
    }
  },
  {
    "id": "coaching",
    "pattern": "coach|session|zoom|مدرب|جلس[ةه]|مهني|carrera|karriere|séance",
    "labels": {
      "en": "1:1 career coaching",
      "ar": "التدريب المهني الفردي",
      "fr": "Coaching carrière individuel",
      "es": "Coaching profesional 1:1",
      "de": "1:1-Karrierecoaching"
    },
    "answer": {
      "en": "Coaches can apply with a profile, LinkedIn link, CV and photo. Admin approval is required before public listing. Paid 1:1 sessions with scheduling and Zoom are being prepared; live bookings are not open yet.",
      "ar": "يمكن للمدربين التقديم بملف تعريفي وLinkedIn وسيرة وصورة. يلزم اعتماد الإدارة قبل الظهور للجمهور. يجري إعداد جلسات فردية مدفوعة بمواعيد وZoom؛ الحجز الحقيقي غير متاح بعد.",
      "fr": "Les coachs peuvent postuler avec profil, LinkedIn, CV et photo. Une validation administrative est nécessaire avant publication. Des séances individuelles payantes avec calendrier et Zoom sont en préparation ; les réservations réelles ne sont pas encore ouvertes.",
      "es": "Los coaches pueden solicitar registro con perfil, LinkedIn, CV y foto. Se requiere aprobación administrativa antes de publicar. Se preparan sesiones de pago 1:1 con calendario y Zoom; las reservas reales aún no están abiertas.",
      "de": "Coachs können sich mit Profil, LinkedIn, Lebenslauf und Foto bewerben. Vor Veröffentlichung ist eine Adminfreigabe nötig. Bezahlte Einzelsitzungen mit Terminplanung und Zoom werden vorbereitet; echte Buchungen sind noch nicht geöffnet."
    }
  },
  {
    "id": "business",
    "pattern": "univers|business|b2b|student|center|centre|جامع|مركز|طلاب|طلب[ةه]|hochschul",
    "labels": {
      "en": "For universities",
      "ar": "للجامعات والمراكز",
      "fr": "Pour les universités",
      "es": "Para universidades",
      "de": "Für Hochschulen"
    },
    "answer": {
      "en": "Mostaed is exploring pilots with universities and employability centers. Students can practise in any supported language and share feedback. Institutional prices and agreements are not confirmed yet.",
      "ar": "يستكشف مستعد تجارب مع الجامعات ومراكز التوظيف. يمكن للطلاب التدريب بأي لغة مدعومة وتقديم ملاحظاتهم. لم تتحدد الأسعار والاتفاقات المؤسسية بعد.",
      "fr": "Mostaed explore des pilotes avec les universités et centres d’employabilité. Les étudiants peuvent pratiquer dans toutes les langues prises en charge et donner leur avis. Tarifs et accords institutionnels ne sont pas encore confirmés.",
      "es": "Mostaed explora pilotos con universidades y centros de empleabilidad. Los estudiantes pueden practicar en cualquier idioma admitido y dar comentarios. Precios y acuerdos institucionales aún no están confirmados.",
      "de": "Mostaed prüft Pilotprogramme mit Hochschulen und Beschäftigungszentren. Studierende können in jeder unterstützten Sprache üben und Feedback geben. Institutionelle Preise und Vereinbarungen sind noch nicht bestätigt."
    }
  },
  {
    "id": "android",
    "pattern": "android|download|store|أندرويد|تحميل|متجر|télécharg|descarg",
    "labels": {
      "en": "Android app",
      "ar": "تطبيق أندرويد",
      "fr": "Application Android",
      "es": "Aplicación Android",
      "de": "Android-App"
    },
    "answer": {
      "en": "Use the web app on your phone today. Android is in preparation; no Google Play release date is confirmed.",
      "ar": "استخدم نسخة الويب على هاتفك الآن. أندرويد قيد الإعداد ولا يوجد موعد مؤكد للنشر على Google Play.",
      "fr": "Utilisez l’application web sur votre téléphone. Android est en préparation ; aucune date Google Play n’est confirmée.",
      "es": "Usa la aplicación web en tu móvil. Android se prepara; no hay fecha confirmada en Google Play.",
      "de": "Nutzen Sie die Web-App auf Ihrem Handy. Android ist in Vorbereitung; ein Google-Play-Termin ist noch nicht bestätigt."
    }
  }
];
for(const t of topics){Object.assign(t,t.labels);t.match=new RegExp(t.pattern,'i');}
export function faqAnswer(message,language='en',topic){
 const codes=['en','ar','fr','es','de'],code=codes.includes(language)?language:'en';
 const found=topic?topics.find(t=>t.id===topic):[...topics.filter(t=>t.id!=='free'),topics[0]].find(t=>t.match.test(message));
 return found?.answer[code]||inquiryCopy.fallback[codes.indexOf(code)];
}
export const productFacts=topics.map(t=>t.id+': '+t.answer.en).join('\n');
