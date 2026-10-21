/**
 * EverHaven Care: website lead sheet and analytics
 * 1. Paste into Extensions > Apps Script on the lead Google Sheet, save.
 * 2. Project Settings > Script properties: add SUMMARY_KEY (the read key for the dashboard sync).
 * 3. Run setup() once and authorize. It adds Website Leads, Website Events and Website Summary tabs
 *    (other tabs in the sheet are never touched) and an hourly refresh.
 * 4. Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone).
 *    Copy the Web app URL into EVERHAVEN.sheetWebhook in index.html.
 *
 * Privacy: no cookies, no IP addresses, no form contents in Events. Forms never collect
 * client names, birth dates or diagnoses.
 */
const SHEET_NAME = 'Website Leads';
const EVENTS_NAME = 'Website Events';
const SUMMARY_NAME = 'Website Summary';
const TIME_ZONE = 'America/Chicago';
const SITE_HOST = /(^|\.)everhavencare\.com$/;
const COLUMNS = [
  'Submitted', 'Form', 'Name', 'I am a', 'Agency / county', 'Phone', 'Email',
  'Tour date', 'Tour time', 'Add tour to Google Calendar', 'Funding', 'Client age range', 'Move-in timeline', 'Care needs', 'Notes',
  'Send referral packet', 'Page', 'Status', 'Owner', 'Next step'
];
const EVENT_COLUMNS = ['Time', 'Event', 'Detail', 'Page', 'Host', 'Source', 'Medium', 'Campaign', 'Referrer', 'Device', 'Session'];
const ACTIONS = {
  call: 'Phone taps', email: 'Email taps', cta_referral: 'Referral button', cta_book: 'Book a tour button',
  booking_open: 'Booking calendar used', video_play: 'Video plays', gallery_open: 'Gallery opens',
  tour_3d: '3D tour opens', guide_download: 'Guide downloads', form_start: 'Forms started'
};

function doPost(e) {
  let d = {};
  try { d = JSON.parse(e.postData.contents); } catch (err) { d = e.parameter || {}; }
  if (d.botcheck) return ContentService.createTextOutput('ok');
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (d.type === 'event') logEvent(d); else logLead(d);
  } finally {
    lock.releaseLock();
  }
  return ContentService.createTextOutput('ok');
}

function logLead(d) {
  const sh = tab(SHEET_NAME, COLUMNS);
  sh.appendRow([
    d.submitted ? new Date(d.submitted) : new Date(),
    txt(d.form), txt(d.name), txt(d.who), txt(d.agency), txt(d.phone), txt(d.email),
    txt(d.date), txt(d.time), txt(d.add_to_google_calendar), txt(d.funding), txt(d.age_range), txt(d.timeline), txt(d.care), txt(d.notes),
    d.send_referral_packet ? 'Yes' : '', txt(d.page), 'New', '', ''
  ]);
}

function logEvent(d) {
  const sh = tab(EVENTS_NAME, EVENT_COLUMNS);
  sh.appendRow([
    new Date(), txt(d.event, 40), txt(d.detail, 120), txt(d.page, 200), txt(d.host, 80), txt(d.src, 80),
    txt(d.med, 40), txt(d.cmp, 80), txt(d.ref, 120), txt(d.dev, 10), txt(d.sid, 40)
  ]);
}

// Feeds for the Owner Dashboard sync: totals, or recent leads without names or contact details
function doGet(e) {
  const key = PropertiesService.getScriptProperties().getProperty('SUMMARY_KEY');
  const p = (e && e.parameter) || {};
  if (!key || p.key !== key) return ContentService.createTextOutput('{"error":"forbidden"}').setMimeType(ContentService.MimeType.JSON);
  const days = Math.min(Math.max(parseInt(p.days, 10) || 30, 1), 365);
  const out = p.feed === 'leads' ? recentLeads(days) : summarize(days);
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

// Leads for dashboard alerts. Name, phone, email and notes are left out on purpose.
function recentLeads(days) {
  const since = Date.now() - days * 864e5;
  const leads = rows(SHEET_NAME).filter(function (r) { return r[0] instanceof Date && r[0].getTime() >= since; }).map(function (r) {
    return {
      id: 'L' + r[0].getTime(), submitted: r[0].toISOString(), form: r[1], who: r[3], agency: r[4],
      tourDate: r[7] instanceof Date ? Utilities.formatDate(r[7], TIME_ZONE, 'yyyy-MM-dd') : String(r[7] || ''), tourTime: r[8],
      funding: r[10], ageRange: r[11], timeline: r[12], care: r[13], status: r[17], owner: r[18], nextStep: r[19]
    };
  });
  return { generated: new Date().toISOString(), sheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl(), leads: leads.reverse() };
}

function summarize(days) {
  const now = new Date();
  const dayKey = function (t) { return Utilities.formatDate(t, TIME_ZONE, 'yyyy-MM-dd'); };
  const start = new Date(now.getTime() - (days - 1) * 864e5);
  const startKey = dayKey(start), prevStartKey = dayKey(new Date(start.getTime() - days * 864e5));
  const daily = {};
  for (let i = 0; i < days; i++) daily[dayKey(new Date(start.getTime() + i * 864e5))] = { visits: 0, leads: 0 };

  const cur = { sessions: {}, pageviews: 0, actions: {}, sources: {}, leadSources: {}, forms: {} };
  const prev = { sessions: {} };
  const seenDay = {};
  rows(EVENTS_NAME).forEach(function (r) {
    const t = r[0], ev = r[1], host = r[4], sid = r[10];
    if (!(t instanceof Date) || (host && !SITE_HOST.test(host))) return;
    const k = dayKey(t);
    if (ev === 'pageview') {
      if (k >= startKey) {
        cur.pageviews++;
        if (!cur.sessions[sid]) { cur.sessions[sid] = 1; const s = r[5] || 'direct'; cur.sources[s] = (cur.sources[s] || 0) + 1; }
        if (daily[k] && !seenDay[k + sid]) { seenDay[k + sid] = 1; daily[k].visits++; }
      } else if (k >= prevStartKey) prev.sessions[sid] = 1;
    } else if (k >= startKey) {
      if (ev === 'lead') { const s = r[5] || 'direct'; cur.leadSources[s] = (cur.leadSources[s] || 0) + 1; }
      else if (ACTIONS[ev]) cur.actions[ev] = (cur.actions[ev] || 0) + 1;
    }
  });

  let leads = 0, prevLeads = 0;
  rows(SHEET_NAME).forEach(function (r) {
    if (!(r[0] instanceof Date)) return;
    const k = dayKey(r[0]);
    if (k >= startKey) { leads++; cur.forms[r[1] || 'Other'] = (cur.forms[r[1] || 'Other'] || 0) + 1; if (daily[k]) daily[k].leads++; }
    else if (k >= prevStartKey) prevLeads++;
  });

  const visits = Object.keys(cur.sessions).length, prevVisits = Object.keys(prev.sessions).length;
  const sources = Object.keys(cur.sources).map(function (s) { return { name: s, visits: cur.sources[s], leads: cur.leadSources[s] || 0 }; })
    .sort(function (a, b) { return b.visits - a.visits; }).slice(0, 8);
  return {
    generated: now.toISOString(), days: days,
    totals: { visits: visits, pageviews: cur.pageviews, leads: leads, conversion: visits ? Math.round(leads / visits * 1000) / 10 : 0 },
    previous: { visits: prevVisits, leads: prevLeads },
    leadsByForm: cur.forms,
    actions: Object.keys(ACTIONS).map(function (k) { return { key: k, label: ACTIONS[k], count: cur.actions[k] || 0 }; }),
    sources: sources,
    daily: Object.keys(daily).map(function (k) { return { date: k, visits: daily[k].visits, leads: daily[k].leads }; })
  };
}

// Run once: tabs, time zone, hourly Summary refresh
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetTimeZone(TIME_ZONE);
  tab(SHEET_NAME, COLUMNS); tab(EVENTS_NAME, EVENT_COLUMNS); tab(SUMMARY_NAME, null);
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'refreshSummary') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('refreshSummary').timeBased().everyHours(1).create();
  refreshSummary();
  if (!PropertiesService.getScriptProperties().getProperty('SUMMARY_KEY')) Logger.log('Add SUMMARY_KEY in Project Settings > Script properties.');
}

function refreshSummary() {
  const s = summarize(30), sh = tab(SUMMARY_NAME, null);
  sh.clear();
  const put = function (row, col, values) { sh.getRange(row, col, values.length, values[0].length).setValues(values); return row + values.length + 1; };
  sh.getRange('A1').setValue('Last 30 days, updated ' + Utilities.formatDate(new Date(), TIME_ZONE, 'MMM d, h:mm a')).setFontWeight('bold');
  let r = put(3, 1, [['Visits', 'Leads', 'Conversion', 'Page views'], [s.totals.visits, s.totals.leads, s.totals.conversion / 100, s.totals.pageviews]]);
  sh.getRange(4, 3).setNumberFormat('0.0%');
  r = put(r, 1, [['Leads by form', 'Count']].concat(Object.keys(s.leadsByForm).length ? Object.keys(s.leadsByForm).map(function (k) { return [k, s.leadsByForm[k]]; }) : [['None yet', 0]]));
  r = put(r, 1, [['Action', 'Count']].concat(s.actions.map(function (a) { return [a.label, a.count]; })));
  put(r, 1, [['Source', 'Visits', 'Leads']].concat(s.sources.length ? s.sources.map(function (x) { return [x.name, x.visits, x.leads]; }) : [['None yet', 0, 0]]));
  put(3, 6, [['Date', 'Visits', 'Leads']].concat(s.daily.map(function (d) { return [d.date, d.visits, d.leads]; })));
  [3].concat(sh.getRange('A:A').getValues().map(function (v, i) { return /^(Leads by form|Action|Source)$/.test(v[0]) ? i + 1 : 0; }).filter(Number))
    .forEach(function (row) { sh.getRange(row, 1, 1, 3).setFontWeight('bold'); });
  sh.getRange(3, 6, 1, 3).setFontWeight('bold');
  if (!sh.getCharts().length) {
    sh.insertChart(sh.newChart().asLineChart().addRange(sh.getRange(3, 6, s.daily.length + 1, 3))
      .setPosition(3, 10, 0, 0).setOption('title', 'Visits and leads, last 30 days').setOption('legend', { position: 'bottom' }).build());
  }
}

function tab(name, columns) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (columns && sh.getLastRow() === 0) {
    sh.appendRow(columns);
    sh.getRange(1, 1, 1, columns.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function rows(name) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
}

// Visitor text is stored as plain text, never run as a formula (=, +, -, @)
function txt(v, max) {
  v = v == null ? '' : String(v).slice(0, max || 2000);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}
