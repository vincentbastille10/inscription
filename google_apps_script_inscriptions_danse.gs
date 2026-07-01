/*
Centre de Danse Delphine Letort - Google Sheet pre-inscriptions

Installation :
1. Creer une Google Sheet.
2. Extensions > Apps Script.
3. Coller ce script.
4. Lancer setupDanceInscriptionSheet une premiere fois.
5. Deployer en application web.
6. Coller l'URL de l'application web dans app.js, constante GOOGLE_APPS_SCRIPT_URL.
*/

const MAX_PER_COURSE = 30;
const NOTIFY_EMAIL = 'contactdelphineletort@gmail.com';
const SHEET_ID = '15VH3p9iLwv1gOuKkgRMU59mAd7PbTCPW14BeEbH2F7Y';
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit';

const COURSES = [
  ['classique-gs', 'EVEIL A LA DANSE - GS', 'Classique', 350, 'Samedi 9h15-10h'],
  ['classique-cp', 'DANSE CLASSIQUE - CP', 'Classique', 350, 'Samedi 10h15-11h15'],
  ['classique-ce1-ce2', 'DANSE CLASSIQUE - CE1 / CE2', 'Classique', 350, 'Samedi 11h15-12h15'],
  ['classique-3', 'DANSE CLASSIQUE 3', 'Classique', 350, 'Samedi 13h45-15h'],
  ['classique-4', 'DANSE CLASSIQUE 4', 'Classique', 350, 'Samedi 15h-16h15'],
  ['classique-5', 'DANSE CLASSIQUE 5', 'Classique', 350, 'Mercredi 16h30-18h'],
  ['soul-enfants', 'DANSE SOUL JAZZ ENFANTS', 'Soul Jazz', 300, 'Jeudi 18h15 ou selon groupe'],
  ['soul-ados-1', 'DANSE SOUL JAZZ ADOS - NIVEAU 1', 'Soul Jazz', 300, 'Mercredi 18h-19h15'],
  ['soul-ados-2', 'DANSE SOUL JAZZ ADOS - NIVEAU 2', 'Soul Jazz', 300, 'Jeudi - horaire a confirmer'],
  ['street-ados', 'STREET DEBUTANT ADOS', 'Street', 350, 'Samedi 12h-13h'],
  ['street-adultes', 'STREET DEBUTANT ADULTES', 'Street', 350, 'Mercredi 20h45-21h45'],
  ['barre-terre', 'SWEET BARRE A TERRE', 'Adultes', 300, 'Mardi 19h30-20h30'],
  ['technique', 'COURS TECHNIQUE', 'Technique', 180, 'Vendredi 18h30-19h45'],
  ['concours-cnd', 'PREPARATION AUX CONCOURS CND', 'Technique', 180, 'Classique et Jazz - a confirmer']
];

const MAIN_SHEET = 'Toutes les inscriptions';
const COURSE_SHEET = 'Cours';
const AVAILABILITY_SHEET = 'Places restantes';
const WAITLIST_SHEET = 'Liste attente';

const CATEGORY_SHEETS = {
  'Classique': 'Classique',
  'Soul Jazz': 'Soul Jazz',
  'Street': 'Street',
  'Technique': 'Technique',
  'Adultes': 'Adultes'
};

const HEADERS = [
  'Date inscription', 'Statut', 'Categorie', 'ID cours', 'Cours choisi', 'Horaire',
  'Prix cours', 'Total dossier', 'Places restantes', 'Age declare', 'Nom parent',
  'Nom enfant / eleve', 'Date de naissance', 'Telephone', 'Email', 'Adresse',
  'Message', 'Mention legale'
];

function setupDanceInscriptionSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  setHeaders_(sheet_(ss, MAIN_SHEET), HEADERS);
  setHeaders_(sheet_(ss, WAITLIST_SHEET), HEADERS);

  Object.keys(CATEGORY_SHEETS).forEach(category => {
    setHeaders_(sheet_(ss, CATEGORY_SHEETS[category]), HEADERS);
  });

  const courses = sheet_(ss, COURSE_SHEET);
  setHeaders_(courses, ['ID cours', 'Cours', 'Categorie', 'Prix', 'Capacite max', 'Horaire']);
  if (courses.getLastRow() < 2) {
    const rows = COURSES.map(c => [c[0], c[1], c[2], c[3], MAX_PER_COURSE, c[4]]);
    courses.getRange(2, 1, rows.length, 6).setValues(rows);
  }

  refreshAvailabilitySheet();
}

function doPost(e) {
  setupDanceInscriptionSheet();
  const payload = parsePayload_(e);
  const saved = savePayload_(payload);
  refreshAvailabilitySheet();
  sendNotificationEmail_(payload);
  return json_({ ok: true, saved });
}

function sendNotificationEmail_(payload) {
  try {
    const courses = payload.selectedCourses || [];
    const lines = courses.map(c =>
      '- ' + (c.title || '') + ' (' + (c.category || '') + ', ' + (c.schedule || '') + ') : ' + Number(c.price || 0) + ' EUR'
    ).join('\n');

    const total = Number(payload.total || 0);
    const subject = 'Nouvelle pre-inscription danse - ' +
      (payload.childName || payload.parentName || 'eleve') + ' (' + total + ' EUR)';

    const body =
      'Nouvelle pre-inscription recue depuis le site.\n\n' +
      '=== COORDONNEES ===\n' +
      'Nom du parent : ' + (payload.parentName || '') + '\n' +
      'Nom enfant / eleve : ' + (payload.childName || '') + '\n' +
      'Age declare : ' + (payload.age || '') + '\n' +
      'Date de naissance : ' + (payload.birthDate || '') + '\n' +
      'Telephone : ' + (payload.phone || '') + '\n' +
      'Email : ' + (payload.email || '') + '\n' +
      'Adresse : ' + (payload.address || '') + '\n' +
      'Message : ' + (payload.message || '') + '\n\n' +
      '=== COURS CHOISIS ===\n' + (lines || '(aucun)') + '\n\n' +
      '=== TOTAL A PAYER : ' + total + ' EUR ===\n\n' +
      'Rappel : cette pre-inscription ne garantit pas l\'adhesion a l\'ecole de danse.\n' +
      'Toutes les inscriptions sont aussi enregistrees dans la Google Sheet.';

    // Version HTML : le mot "Google Sheet" devient un lien cliquable vers la vraie feuille.
    const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const htmlBody = esc(body)
      .replace(/\n/g, '<br>')
      .replace('Google Sheet', '<a href="' + SHEET_URL + '">Google Sheet</a>');

    const options = { htmlBody: htmlBody };
    if (payload.email) options.replyTo = payload.email;

    MailApp.sendEmail(NOTIFY_EMAIL, subject, body, options);
  } catch (err) {
    // Ne bloque jamais l'enregistrement dans la Sheet si l'email echoue.
    console.error('Email notification failed: ' + err);
  }
}

function doGet(e) {
  const callback = e && e.parameter && e.parameter.callback;
  return json_({ ok: true, courses: getAvailability_() }, callback);
}

function savePayload_(payload) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const all = sheet_(ss, MAIN_SHEET);
  const waitlist = sheet_(ss, WAITLIST_SHEET);
  const availability = getAvailability_();
  const courses = payload.selectedCourses || [];
  let saved = 0;

  courses.forEach(course => {
    const remaining = availability[course.id] ? availability[course.id].remaining : MAX_PER_COURSE;
    const status = remaining <= 0 ? 'Liste attente' : 'Pre-inscription';
    const row = [
      new Date(), status, course.category || '', course.id || '', course.title || '', course.schedule || '',
      Number(course.price || 0), Number(payload.total || 0), Number(remaining || 0), payload.age || '',
      payload.parentName || '', payload.childName || '', payload.birthDate || '', payload.phone || '',
      payload.email || '', payload.address || '', payload.message || '',
      "Cette pre-inscription ne garantit pas votre adhesion a l'ecole de danse."
    ];

    all.appendRow(row);
    const categorySheet = CATEGORY_SHEETS[course.category];
    if (categorySheet) sheet_(ss, categorySheet).appendRow(row);
    if (status === 'Liste attente') waitlist.appendRow(row);
    saved++;
  });

  return saved;
}

function refreshAvailabilitySheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sh = sheet_(ss, AVAILABILITY_SHEET);
  setHeaders_(sh, ['ID cours', 'Cours', 'Categorie', 'Capacite max', 'Inscriptions recues', 'Places restantes', 'Statut']);
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 7).clearContent();

  const availability = getAvailability_();
  const rows = COURSES.map(c => {
    const a = availability[c[0]];
    return [c[0], c[1], c[2], MAX_PER_COURSE, a.reserved, a.remaining, a.remaining <= 0 ? 'Complet' : a.remaining <= 3 ? 'Urgent' : 'Ouvert'];
  });
  sh.getRange(2, 1, rows.length, 7).setValues(rows);
}

function getAvailability_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const all = sheet_(ss, MAIN_SHEET);
  const values = all.getDataRange().getValues();
  const counts = {};

  for (let i = 1; i < values.length; i++) {
    const status = String(values[i][1] || '');
    const courseId = String(values[i][3] || '');
    if (!courseId || status === 'Liste attente' || status === 'Refuse') continue;
    counts[courseId] = (counts[courseId] || 0) + 1;
  }

  const out = {};
  COURSES.forEach(c => {
    const reserved = counts[c[0]] || 0;
    out[c[0]] = { reserved, remaining: Math.max(0, MAX_PER_COURSE - reserved) };
  });
  return out;
}

function parsePayload_(e) {
  if (e && e.parameter && e.parameter.payload) return JSON.parse(e.parameter.payload);
  if (e && e.postData && e.postData.contents) return JSON.parse(e.postData.contents);
  return {};
}

function sheet_(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function setHeaders_(sh, headers) {
  sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  sh.setFrozenRows(1);
}

function json_(data, callback) {
  const body = JSON.stringify(data);
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + body + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}
