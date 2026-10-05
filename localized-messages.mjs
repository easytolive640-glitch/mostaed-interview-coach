import {extraMessages} from './extra-messages.mjs';
import {coachingCopy} from './coaching-copy.mjs';
import {ui,normalizeLanguage} from './locales.mjs';
const messages={
'Signed in. Paid AI requires a verified subscription.':['تم تسجيل الدخول. يتطلب التدريب الذكي اشتراكاً مؤكداً.',"Connexion réussie. Un abonnement vérifié est requis pour l’IA.",'Sesión iniciada. La IA requiere una suscripción verificada.','Angemeldet. KI-Coaching erfordert ein verifiziertes Abo.'],
'Signed out.':['تم تسجيل الخروج.','Déconnexion effectuée.','Sesión cerrada.','Abgemeldet.'],
'Signing in…':['جارٍ تسجيل الدخول…','Connexion en cours…','Iniciando sesión…','Anmeldung läuft…'],
'Passwords do not match.':['كلمتا المرور غير متطابقتين.','Les mots de passe ne correspondent pas.','Las contraseñas no coinciden.','Die Passwörter stimmen nicht überein.'],
'Enter your full name and a valid username.':['أدخل الاسم الكامل واسم مستخدم صحيحاً.',"Saisissez votre nom complet et un nom d’utilisateur valide.",'Introduce tu nombre completo y un nombre de usuario válido.','Geben Sie Ihren vollständigen Namen und einen gültigen Benutzernamen ein.'],
'Check your email to confirm your account, then sign in.':['أكد حسابك من بريدك الإلكتروني ثم سجل الدخول.',"Confirmez votre compte par e-mail, puis connectez-vous.",'Confirma tu cuenta por correo y luego inicia sesión.','Bestätigen Sie Ihr Konto per E-Mail und melden Sie sich an.'],
'Choose a new password below.':['اختر كلمة مرور جديدة أدناه.',"Choisissez un nouveau mot de passe ci-dessous.",'Elige una nueva contraseña a continuación.','Wählen Sie unten ein neues Passwort.'],
'If this email has an account, you will receive a password reset link. Check your inbox and spam folder.':['إذا كان البريد مرتبطاً بحساب فسيصلك رابط لإعادة تعيين كلمة المرور. تحقق من الرسائل والبريد العشوائي.',"Si ce compte existe, vous recevrez un lien de réinitialisation. Vérifiez votre boîte de réception et les indésirables.",'Si existe una cuenta, recibirás un enlace para restablecer la contraseña. Revisa la bandeja de entrada y el spam.','Falls ein Konto besteht, erhalten Sie einen Link zum Zurücksetzen. Prüfen Sie Posteingang und Spam.'],
'Password updated. Sign in with your new password.':['تم تحديث كلمة المرور. سجل الدخول بالكلمة الجديدة.',"Mot de passe modifié. Connectez-vous avec le nouveau mot de passe.",'Contraseña actualizada. Inicia sesión con la nueva contraseña.','Passwort aktualisiert. Melden Sie sich mit dem neuen Passwort an.'],
'Google sign-in could not be completed. Please try again.':['تعذر إكمال الدخول باستخدام Google. حاول مجدداً.',"Connexion Google impossible. Réessayez.",'No se pudo completar el acceso con Google. Inténtalo de nuevo.','Google-Anmeldung fehlgeschlagen. Versuchen Sie es erneut.'],
'Google sign-in expired. Please start again in this tab.':['انتهت صلاحية تسجيل الدخول. ابدأ مجدداً في علامة التبويب نفسها.',"Connexion Google expirée. Recommencez dans cet onglet.",'El acceso con Google caducó. Vuelve a empezar en esta pestaña.','Google-Anmeldung abgelaufen. Starten Sie in diesem Tab erneut.'],
'Google sign-in was cancelled or unavailable. Please try again.':['تم إلغاء الدخول باستخدام Google أو أنه غير متاح. حاول مجدداً.',"Connexion Google annulée ou indisponible. Réessayez.",'Acceso con Google cancelado o no disponible. Inténtalo de nuevo.','Google-Anmeldung abgebrochen oder nicht verfügbar. Versuchen Sie es erneut.'],
'Request a new password reset link.':['اطلب رابطاً جديداً لإعادة تعيين كلمة المرور.',"Demandez un nouveau lien de réinitialisation.",'Solicita un nuevo enlace para restablecer la contraseña.','Fordern Sie einen neuen Link zum Zurücksetzen an.'],
'Reset link is invalid. Request a new link.':['رابط إعادة التعيين غير صالح. اطلب رابطاً جديداً.',"Lien invalide. Demandez un nouveau lien.",'El enlace no es válido. Solicita uno nuevo.','Der Link ist ungültig. Fordern Sie einen neuen an.'],
'An active paid subscription is required.':['يلزم اشتراك مدفوع نشط.',"Un abonnement payant actif est requis.",'Se requiere una suscripción de pago activa.','Ein aktives kostenpflichtiges Abo ist erforderlich.'],
'Paid AI is not open yet. Free practice remains available from the home page.':['التدريب الذكي غير متاح حالياً. التدريب المجاني متاح في الصفحة الرئيسية.',"L’IA est indisponible pour le moment. L’entraînement gratuit reste accessible depuis l’accueil.",'La IA no está disponible ahora. Puedes practicar gratis desde la página principal.','KI-Coaching ist derzeit nicht verfügbar. Kostenlose Übung ist über die Startseite verfügbar.'],
'Choose WAV, WebM or MP4.':['اختر WAV أو WebM أو MP4.','Choisissez WAV, WebM ou MP4.','Elige WAV, WebM o MP4.','Wählen Sie WAV, WebM oder MP4.'],
'Choose a small .txt CV file.':['اختر ملف سيرة .txt صغيراً.',"Choisissez un petit fichier de CV .txt.",'Elige un archivo .txt pequeño para el CV.','Wählen Sie eine kleine .txt-Datei für den Lebenslauf.'],
'Provide at least 30 characters of CV text and tick consent, or leave CV blank.':['أدخل 30 حرفاً على الأقل من السيرة ووافق على الإرسال، أو اتركها فارغة.',"Saisissez au moins 30 caractères et donnez votre accord, ou laissez le CV vide.",'Introduce al menos 30 caracteres y acepta el envío, o deja el CV vacío.','Geben Sie mindestens 30 Zeichen ein und stimmen Sie zu, oder lassen Sie das Feld leer.'],
'Use up to 6000 characters of relevant CV text.':['استخدم حتى 6000 حرف من النص المرتبط بالسؤال.',"Utilisez au maximum 6 000 caractères pertinents du CV.",'Usa hasta 6000 caracteres relevantes del CV.','Verwenden Sie maximal 6000 relevante Zeichen des Lebenslaufs.'],
'Recording is larger than 2 MB. Please record a shorter answer.':['التسجيل أكبر من 2 ميجابايت. سجل إجابة أقصر.',"L’enregistrement dépasse 2 Mo. Enregistrez une réponse plus courte.",'La grabación supera 2 MB. Graba una respuesta más breve.','Die Aufnahme ist größer als 2 MB. Nehmen Sie eine kürzere Antwort auf.'],
'Recording is unavailable here. Upload a WAV/WebM/MP4 file instead.':['التسجيل غير متاح هنا. ارفع ملف WAV أو WebM أو MP4.',"Enregistrement indisponible. Importez un fichier WAV/WebM/MP4.",'La grabación no está disponible. Sube un archivo WAV/WebM/MP4.','Aufnahme nicht verfügbar. Laden Sie eine WAV/WebM/MP4-Datei hoch.'],
'Recording ready. Play it back before submitting.':['التسجيل جاهز. استمع إليه قبل الإرسال.',"Enregistrement prêt. Écoutez-le avant l’envoi.",'Grabación lista. Escúchala antes de enviarla.','Aufnahme bereit. Hören Sie sie vor dem Absenden an.'],
'Voice answer ready. Play it back before submitting':['الإجابة الصوتية جاهزة. استمع إليها قبل الإرسال.',"Réponse audio prête. Écoutez-la avant l’envoi.",'Respuesta de audio lista. Escúchala antes de enviarla.','Audioantwort bereit. Hören Sie sie vor dem Absenden an.'],
'Recording…':['جارٍ التسجيل…','Enregistrement…','Grabando…','Aufnahme läuft…'],
'Stop recording before submitting.':['أوقف التسجيل قبل الإرسال.',"Arrêtez l’enregistrement avant l’envoi.",'Detén la grabación antes de enviarla.','Beenden Sie die Aufnahme vor dem Absenden.'],
'The selected audio was not accepted. Choose WAV, WebM or MP4 before submitting.':['لم يُقبل الملف الصوتي. اختر WAV أو WebM أو MP4.',"Audio refusé. Choisissez WAV, WebM ou MP4 avant l’envoi.",'El audio no se aceptó. Elige WAV, WebM o MP4 antes de enviarlo.','Die Audiodatei wurde nicht akzeptiert. Wählen Sie WAV, WebM oder MP4.'],
'Sign in before subscribing.':['سجل الدخول قبل الاشتراك.',"Connectez-vous avant de vous abonner.",'Inicia sesión antes de suscribirte.','Melden Sie sich vor dem Abonnieren an.'],
'Signed in with Google. Paid AI requires a verified subscription.':['تم الدخول باستخدام Google. يلزم اشتراك مؤكد للتدريب الذكي.',"Connexion Google réussie. Un abonnement vérifié est requis pour l’IA.",'Acceso con Google completado. La IA requiere una suscripción verificada.','Mit Google angemeldet. KI-Coaching erfordert ein verifiziertes Abo.'],
'Sign in with your email and password.':['سجل الدخول بالبريد وكلمة المرور.',"Connectez-vous avec votre e-mail et votre mot de passe.",'Inicia sesión con tu correo y contraseña.','Melden Sie sich mit E-Mail und Passwort an.'],
};
Object.assign(messages,extraMessages);
export {messages};
const coachingAliases={
'Sign in to your Mostaed account first.':'signin',
"Availability added.":"availabilityAdded",
"Test alert sent to the configured admin email.":"alertSent",
"Payment received. Meeting setup is in progress or needs support review. Check My sessions.":"meetingPreparing",
"Payment verified. Meeting setup needs support review; you will not be charged again.":"meetingSupport",
"Payment has not been verified. No meeting has been confirmed.":"paymentUnverified",
"Choose a time between two hours and 90 days from now.":"chooseSlotTime",
"This time overlaps an existing slot.":"overlap",
"Mostaed administrator access required.":"adminRequired",
"Your coach profile must be approved first.":"approvedFirst",
"Only pending or paused applications can update credentials.":"onlyPending",
"CV access denied.":"privateDenied",
"This booking is already paid. View it in My sessions.":"alreadyPaid",
"This booking was cancelled. Contact Mostaed if you have already paid.":"bookingCancelled",
"This session time has passed. Contact Mostaed before making a payment.":"sessionPassed",
"Booking not found in this payment environment.":"bookingNotFound",
"Review LinkedIn and CV, confirm your review, and assign a valid managed Zoom host email or ID.":"reviewRequired",
'Coach approved and published.':'approved',
'Application paused; not publicly listed.':'paused',
'Your coach application is already saved.':'applicationSuccess',
'Consent is required before submitting your coach application.':'applicationInvalid',
'Application received. Mostaed will review your profile before it appears publicly.':'applicationSuccess',
'Credentials saved for review.':'credentialsSaved',
'No profile photo uploaded yet.':'photoError',
'No CV uploaded yet.':'noSavedCV',
'Paid session bookings are not open yet.':'closed',
'Session confirmed. Your private Zoom link is in My sessions.':'confirmed',
'Sandbox payment verified; this is a test booking.':'sandbox',
'Career coaching is temporarily unavailable. Please try again or contact Mostaed.':'unavailable',
};
export function localizeMessage(message,language){
 const text=String(message),key=text.split(' / ')[0],target=normalizeLanguage(language),i=['english','arabic','french','spanish','german'].indexOf(target);
 if(i>0&&coachingAliases[key])return coachingCopy[coachingAliases[key]][i];
 const matched=Object.entries(messages).find(([en,row])=>en===key||row.includes(key));
 if(matched)return i===0?matched[0]:matched[1][i-1];
 const uiRow=Object.values({...ui,...coachingCopy}).find(row=>row.includes(key));if(uiRow)return uiRow[i];
 return i===0?text:messages['Request unavailable'][i-1];
}
