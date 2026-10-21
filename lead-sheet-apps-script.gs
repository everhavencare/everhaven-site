/**
 * EverHaven Care: website lead sheet
 * Paste into Extensions > Apps Script on a new Google Sheet, then Deploy > New deployment > Web app
 * (Execute as: Me, Who has access: Anyone). Copy the Web app URL into EVERHAVEN.sheetWebhook in index.html.
 */
const SHEET_NAME = 'Leads';
const COLUMNS = [
  'Submitted', 'Form', 'Name', 'I am a', 'Agency / county', 'Phone', 'Email',
  'Tour date', 'Tour time', 'Add tour to Google Calendar', 'Funding', 'Client age range', 'Move-in timeline', 'Care needs', 'Notes',
  'Send referral packet', 'Page', 'Status', 'Owner', 'Next step'
];

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(COLUMNS);
    sh.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  let d = {};
  try { d = JSON.parse(e.postData.contents); } catch (err) { d = e.parameter || {}; }
  if (d.botcheck) return ContentService.createTextOutput('ok');
  sh.appendRow([
    d.submitted ? new Date(d.submitted) : new Date(),
    txt(d.form), txt(d.name), txt(d.who), txt(d.agency), txt(d.phone), txt(d.email),
    txt(d.date), txt(d.time), txt(d.add_to_google_calendar), txt(d.funding), txt(d.age_range), txt(d.timeline), txt(d.care), txt(d.notes),
    d.send_referral_packet ? 'Yes' : '', txt(d.page), 'New', '', ''
  ]);
  return ContentService.createTextOutput('ok');
}

// Visitor text is stored as plain text, never run as a formula (=, +, -, @)
function txt(v) {
  v = v == null ? '' : String(v).slice(0, 2000);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}
