/*****************************************************************
 *  CONFIG  –  set these Script Properties in Apps Script:
 *    HUBSPOT_API_KEY   AIRCALL_ID   AIRCALL_TOKEN
 *****************************************************************/
const HUBSPOT_API_KEY = PropertiesService.getScriptProperties().getProperty('HUBSPOT_API_KEY');
const AIRCALL_ID      = PropertiesService.getScriptProperties().getProperty('AIRCALL_ID');
const AIRCALL_TOKEN   = PropertiesService.getScriptProperties().getProperty('AIRCALL_TOKEN');

const CURRENT_YEAR = 2025;
const SHEET_NAME   = 'DealsLeaderboard';

/*****************************************************************
 *  PUBLIC ENDPOINT  (exec URL)
 *****************************************************************/
function doGet() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sh) return ContentService.createTextOutput('{}');

  const data = sh.getDataRange().getValues();
  const hdr = data[0] || [];
  const rows = data.slice(1).map(r => {
    const obj = { email: r[0] };
    for (let i = 1; i < hdr.length; i++) obj[hdr[i]] = r[i];
    return obj;
  });
  return ContentService
    .createTextOutput(JSON.stringify({ leaderboard: rows }))
    .setMimeType(ContentService.MimeType.JSON);
}

/*****************************************************************
 *  MAIN REFRESH – run manually or via time-trigger
 *****************************************************************/
function updateFromHubSpot() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  sh ? sh.clear() : (sh = ss.insertSheet(SHEET_NAME));

  sh.appendRow([
    'Sales Rep',
    'May 2025 $',  'May Deals',
    'June 2025 $', 'June Deals',
    `YTD ${CURRENT_YEAR} $`, 'YTD Deals',
    'Week $',      'Week Deals',
    'June Calls'
  ]);

  const deals = fetchClosedWonDeals();
  const ownerMap = fetchAllOwners();
  const weekStart = mondayStart(new Date());

  const board = {}; // { email : repObj }

  deals.forEach(d => {
    const p = d.properties || {};
    const email = ownerMap[p.hubspot_owner_id] || 'unknown@rep.com';
    const amount = parseFloat(p.amount) || 0;
    const closed = p.closedate ? new Date(p.closedate) : null;
    if (!closed || isNaN(closed)) return;

    if (!board[email]) board[email] = blankRep();

    const m = closed.getMonth(); // 0 = Jan
    if (closed.getFullYear() === CURRENT_YEAR) {
      add(board[email].ytd, amount);
      if (m === 4) add(board[email].may, amount);   // May
      if (m === 5) add(board[email].june, amount);  // June
    }
    if (closed >= weekStart) add(board[email].week, amount);
  });

  const juneCounts = fetchJune2025AircallCounts(); // { username : calls }

  Object.entries(juneCounts).forEach(([user, cnt]) => {
    const emailKey = Object.keys(board)
      .find(e => e.toLowerCase().startsWith(user)) || `${user}@unknown.com`;
    if (!board[emailKey]) board[emailKey] = blankRep();
    board[emailKey].juneCalls = cnt;
  });

  Object.entries(board).forEach(([email, d]) => {
    sh.appendRow([
      email,
      d.may.revenue,   d.may.count,
      d.june.revenue,  d.june.count,
      d.ytd.revenue,   d.ytd.count,
      d.week.revenue,  d.week.count,
      d.juneCalls
    ]);
  });
}

/*****************************************************************
 *  HELPERS
 *****************************************************************/
function blankRep() {
  return {
    may   : { revenue: 0, count: 0 },
    june  : { revenue: 0, count: 0 },
    ytd   : { revenue: 0, count: 0 },
    week  : { revenue: 0, count: 0 },
    juneCalls: 0
  };
}
function add(obj, amt) {
  obj.revenue += amt;
  obj.count += 1;
}
function mondayStart(d) {
  const n = new Date(d);
  const offset = n.getDay() === 0 ? -6 : 1 - n.getDay();
  n.setDate(n.getDate() + offset); n.setHours(0, 0, 0, 0);
  return n;
}

/*****************************************************************
 *  HUBSPOT API
 *****************************************************************/
function fetchClosedWonDeals() {
  const list = [];
  let after;
  while (true) {
    const body = {
      filterGroups: [{ filters: [{ propertyName: 'dealstage', operator: 'EQ', value: '50191472' }] }],
      properties: ['amount', 'hubspot_owner_id', 'closedate'],
      limit: 100, after
    };
    const resp = UrlFetchApp.fetch(
      'https://api.hubapi.com/crm/v3/objects/deals/search',
      {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(body),
        headers: { Authorization: `Bearer ${HUBSPOT_API_KEY}` }
      }
    );
    const json = JSON.parse(resp.getContentText());
    list.push(...(json.results || []));
    after = json.paging?.next?.after; if (!after) break;
  }
  return list;
}
function fetchAllOwners() {
  const url = 'https://api.hubapi.com/crm/v3/owners?limit=250';
  const resp = UrlFetchApp.fetch(url, {
    headers: { Authorization: `Bearer ${HUBSPOT_API_KEY}` }
  });
  const map = {};
  JSON.parse(resp.getContentText()).results.forEach(o => {
    map[o.id] = o.email || 'unknown@rep.com';
  });
  return map;
}

/*****************************************************************
 *  AIRCALL – full June-2025 call counts
 *****************************************************************/
function fetchJune2025AircallCounts() {
  const repMap = {};
  const PER_PAGE = 100;
  const JUNE_START = Date.UTC(2025, 5, 1);               // June = 5
  const JUNE_END   = Date.UTC(2025, 5, 31, 23, 59, 59);  // June 31

  for (let page = 1;; page++) {
    const url = `https://api.aircall.io/v1/calls?per_page=${PER_PAGE}&page=${page}&order=desc`;
    const resp = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      headers: {
        Authorization: 'Basic ' + Utilities.base64Encode(`${AIRCALL_ID}:${AIRCALL_TOKEN}`)
      }
    });
    const calls = (JSON.parse(resp.getContentText()).calls) || [];
    if (calls.length === 0) break;

    const oldest = Number(calls[calls.length - 1].started_at) * 1000;

    calls.forEach(c => {
      const ts = Number(c.started_at) * 1000;
      if (ts < JUNE_START || ts > JUNE_END) return;
      if (!c.user || !c.user.email) return;
      const user = c.user.email.split('@')[0].toLowerCase();
      repMap[user] = (repMap[user] || 0) + 1;
    });

    if (oldest < JUNE_START) break;
  }
  return repMap;
}
