/**
 * Relative Industries — lead intake for relative.dev/hire
 *
 * A Google Apps Script web app. Every form submission:
 *   1. is appended to the "Leads" sheet (with a simple fit score),
 *   2. sends the lead a friendly confirmation email,
 *   3. asks Claude to draft their free Time-Back Plan (10 ideas, top 3 first),
 *   4. emails your team the lead + the draft plan to review and send.
 *
 * Setup steps live in _ops/README.md. Script properties used:
 *   NOTIFY_EMAIL       where new-lead alerts go        (default hello@relative.dev)
 *   ANTHROPIC_API_KEY  optional; enables step 3        (Claude API key)
 */

var SHEET_NAME = 'Leads';
var HEADERS = [
  'Received', 'Score', 'Status', 'Name', 'Email', 'Business', 'Website', 'Team size',
  'Time goes to', 'Package interest', 'Message', 'Est. hrs/week back', 'Est. $/yr',
  'Source', 'Page', 'Referrer'
];
var CLAUDE_MODEL = 'claude-opus-5-5';

function doPost(e) {
  try {
    var lead = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    // honeypot: real people never fill this hidden field
    if (lead.company_url) return json_({ ok: true });

    if (!lead.name || !isEmail_(lead.email) || !lead.business) {
      return json_({ ok: false, error: 'missing required fields' });
    }

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      appendLead_(lead);
    } finally {
      lock.releaseLock();
    }

    sendConfirmation_(lead);

    var plan = '';
    try { plan = draftPlan_(lead); } catch (err) { plan = '(Claude draft unavailable: ' + err + ')'; }
    notifyTeam_(lead, plan);

    return json_({ ok: true });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: String(err) });
  }
}

// Lets you open the web-app URL in a browser to check it's live.
function doGet() {
  return json_({ ok: true, service: 'relative.dev leads' });
}

/* ---------- sheet ---------- */

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sh;
}

function appendLead_(lead) {
  var est = lead.estimate || {};
  var t = lead.tracking || {};
  sheet_().appendRow([
    new Date(), score_(lead), 'New', clean_(lead.name), clean_(lead.email), clean_(lead.business),
    clean_(lead.website), clean_(lead.team_size), (lead.pains || []).map(clean_).join(', '),
    clean_(lead.package), clean_(lead.message), est.weekly || '', est.yearly || '',
    [t.utm_source, t.utm_medium, t.utm_campaign, t.ref].filter(Boolean).map(clean_).join(' / '),
    clean_(lead.page), clean_(lead.referrer)
  ]);
}

// Rough 0–100 fit score so the best leads float to the top when you sort.
function score_(lead) {
  var s = 0;
  var team = { 'Just me': 5, '2–5': 20, '6–15': 35, '16–50': 40, '50+': 30 };
  s += team[lead.team_size] || 0;
  s += Math.min(20, (lead.pains || []).length * 5);
  if (lead.website) s += 10;
  if (lead.message && lead.message.length > 40) s += 15;
  if (lead.estimate && lead.estimate.weekly >= 10) s += 10;
  if (lead.package === 'Full Studio' || lead.package === 'Foundations') s += 5;
  return Math.min(100, s);
}

/* ---------- emails ---------- */

function sendConfirmation_(lead) {
  var first = String(lead.name).split(' ')[0];
  var body =
    'Hi ' + first + ',\n\n' +
    'Thanks for telling us about ' + lead.business + '. We got it, and a real person on our team is reading it now.\n\n' +
    'Within 2 business days you\'ll get your free Time-Back Plan: 10 specific ways to win back hours each week, ' +
    'with the 3 we\'d start on first. It\'s yours to keep either way.\n\n' +
    'If anything comes to mind in the meantime, just reply to this email.\n\n' +
    'Warmly,\nRelative Industries\nhttps://relative.dev';
  MailApp.sendEmail({
    to: lead.email,
    replyTo: notifyEmail_(),
    name: 'Relative Industries',
    subject: 'Your Time-Back Plan is on its way',
    body: body
  });
}

function notifyTeam_(lead, plan) {
  var est = lead.estimate ? (lead.estimate.weekly + ' hrs/week (~$' + lead.estimate.yearly + '/yr)') : '—';
  var body =
    'New lead (score ' + score_(lead) + '/100)\n\n' +
    'Name:      ' + lead.name + '\n' +
    'Email:     ' + lead.email + '\n' +
    'Business:  ' + lead.business + '\n' +
    'Website:   ' + (lead.website || '—') + '\n' +
    'Team size: ' + (lead.team_size || '—') + '\n' +
    'Time goes: ' + ((lead.pains || []).join(', ') || '—') + '\n' +
    'Package:   ' + (lead.package || '—') + '\n' +
    'Estimate:  ' + est + '\n\n' +
    'Message:\n' + (lead.message || '—') + '\n\n' +
    '----------------------------------------\n' +
    'DRAFT TIME-BACK PLAN (review, edit, then send within 2 business days)\n' +
    '----------------------------------------\n\n' +
    (plan || '(Add ANTHROPIC_API_KEY in Script Properties to get an automatic draft here.)');
  MailApp.sendEmail({
    to: notifyEmail_(),
    replyTo: lead.email,
    subject: 'New lead: ' + lead.business + ' (' + (lead.team_size || '?') + ')',
    body: body
  });
}

/* ---------- Claude draft ---------- */

function draftPlan_(lead) {
  var key = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!key) return '';

  var prompt =
    'You are drafting a free "Time-Back Plan" for a small business that asked for one on relative.dev. ' +
    'Relative Industries is a friendly, design-minded studio that sets up Claude to take over busywork ' +
    '(intake, email, proposals, follow-ups, reporting, team knowledge) and redesigns websites.\n\n' +
    'Write a warm, plain-English plan addressed to the owner, with:\n' +
    '1. A two-sentence opening that shows you understood their business.\n' +
    '2. "Your top 3 for next week": three specific, low-effort changes they could have running within a week, ' +
    'each with the hours it would likely save per week.\n' +
    '3. "7 more ideas": short bullets for bigger wins (include their website if relevant).\n' +
    '4. A one-line, no-pressure close inviting a reply if they want help doing all of it.\n' +
    'Be concrete to their industry. No hype, no jargon, under 450 words. Plain text, no markdown headings.\n\n' +
    'Their submission:\n' + JSON.stringify({
      business: lead.business, website: lead.website, team_size: lead.team_size,
      time_goes_to: lead.pains, message: lead.message, estimate: lead.estimate
    }, null, 2);

  var res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      // if a request is declined by a safety classifier, retry it on a fallback model server-side
      'anthropic-beta': 'server-side-fallback-2026-07-01'
    },
    payload: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 16000,
      output_config: { effort: 'medium' },
      fallbacks: 'default',
      messages: [{ role: 'user', content: prompt }]
    })
  });

  var data = JSON.parse(res.getContentText());
  if (res.getResponseCode() !== 200) throw new Error((data.error && data.error.message) || res.getResponseCode());
  if (data.stop_reason === 'refusal') throw new Error('request declined');
  return (data.content || [])
    .filter(function (b) { return b.type === 'text'; })
    .map(function (b) { return b.text; })
    .join('\n')
    .trim();
}

/* ---------- helpers ---------- */

function notifyEmail_() {
  return PropertiesService.getScriptProperties().getProperty('NOTIFY_EMAIL') || 'hello@relative.dev';
}

function isEmail_(s) {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

// Strings starting with = + - @ would run as formulas in Sheets; prefix them.
function clean_(v) {
  var s = v == null ? '' : String(v).slice(0, 4000);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
