/**
 * EverHaven Care: website lead sheet
 * Paste into Extensions > Apps Script on a new Google Sheet, then Deploy > New deployment > Web app
 * (Execute as: Me, Who has access: Anyone). Copy the Web app URL into EVERHAVEN.sheetWebhook in index.html.
 */
const SHEET_NAME = 'Leads';
const COLUMNS = [
  'Submitted', 'Form', 'Name', 'Agency / county', 'Phone', 'Email',
  'Funding', 'Client age range', 'Move-in timeline', 'Care needs', 'Notes',
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
    d.form || '', d.name || '', d.agency || '', d.phone || '', d.email || '',
    d.funding || '', d.age_range || '', d.timeline || '', d.care || '', d.notes || '',
    d.send_referral_packet ? 'Yes' : '', d.page || '', 'New', '', ''
  ]);
  return ContentService.createTextOutput('ok');
}
