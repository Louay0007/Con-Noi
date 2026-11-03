/* Endpoint audit probe — mirrors every call the frontend makes, plus write paths. */
const BASE = 'http://localhost:4000/api';

let workerCookie = '';
let adminCookie = '';

const results = [];
function rec(area, name, ok, detail) {
  results.push({ area, name, ok, detail });
  const tag = ok === true ? 'PASS' : ok === 'partial' ? 'PART' : 'FAIL';
  console.log(`${tag}  [${area}] ${name}${detail ? ' :: ' + detail : ''}`);
}

function cookieFrom(res) {
  const raw = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  return raw.map((c) => c.split(';')[0]).join('; ');
}

async function call(method, path, { body, cookie, form } = {}) {
  const headers = {};
  if (cookie) headers.cookie = cookie;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) {
    headers['content-type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(BASE + path, { method, headers, body: payload });
  let json = null;
  const text = await res.text();
  try { json = text ? JSON.parse(text) : null; } catch { json = { _raw: text.slice(0, 200) }; }
  return { status: res.status, json, cookie: cookieFrom(res), res };
}

// The frontend reads payload.items / payload.user directly (no envelope unwrap).
function unwrapped(json) {
  return json && typeof json === 'object' && 'data' in json && 'meta' in json;
}

(async () => {
  console.log('=== AUTH ===');
  const login = await call('POST', '/auth/login', { body: { email: 'marco@test.it', password: 'Worker123!' } });
  workerCookie = login.cookie;
  rec('auth', 'POST /auth/login (worker)', login.status === 200, `status=${login.status}`);
  rec('auth', 'login returns user at top level', !!login.json?.user || !!login.json?.data?.user,
    JSON.stringify(Object.keys(login.json || {})));
  const envelopePresent = unwrapped(login.json);
  console.log(`INFO envelope {"data","meta"} present: ${envelopePresent}`);

  const adminLogin = await call('POST', '/auth/login', { body: { email: 'admin@platform.it', password: 'ChangeMe!2026' } });
  adminCookie = adminLogin.cookie;
  rec('auth', 'POST /auth/login (admin)', adminLogin.status === 200, `status=${adminLogin.status}`);

  const badLogin = await call('POST', '/auth/login', { body: { email: 'marco@test.it', password: 'wrong' } });
  rec('auth', 'POST /auth/login rejects bad password', badLogin.status === 401, `status=${badLogin.status}`);

  const me = await call('GET', '/auth/me', { cookie: workerCookie });
  rec('auth', 'GET /auth/me', me.status === 200, `status=${me.status}`);
  const meUser = me.json?.data ?? me.json;
  rec('auth', 'GET /auth/me shape readable by frontend', !!meUser?.email || !!meUser?.id,
    `keys=${JSON.stringify(Object.keys(meUser || {}))}`);

  const unauth = await call('GET', '/auth/me');
  rec('auth', 'GET /auth/me requires auth', unauth.status === 401, `status=${unauth.status}`);

  const refresh = await call('POST', '/auth/refresh', { cookie: workerCookie });
  rec('auth', 'POST /auth/refresh', refresh.status === 200 || refresh.status === 201, `status=${refresh.status}`);

  console.log('\n=== SPECIALITIES (public) ===');
  const specs = await call('GET', '/specialities');
  rec('specialities', 'GET /specialities', specs.status === 200, `status=${specs.status}`);
  const specArr = Array.isArray(specs.json) ? specs.json : specs.json?.data;
  rec('specialities', 'frontend gets a bare array', Array.isArray(specs.json), `isArray=${Array.isArray(specs.json)}`);
  rec('specialities', 'has seeded rows', Array.isArray(specArr) && specArr.length > 0, `count=${specArr?.length}`);
  const specId = specArr?.[0]?._id;

  console.log('\n=== USERS / PROFILE ===');
  const uMe = await call('GET', '/users/me', { cookie: workerCookie });
  rec('users', 'GET /users/me', uMe.status === 200, `status=${uMe.status}`);
  const patchMe = await call('PATCH', '/users/me', { cookie: workerCookie, body: { bio: 'Audit probe bio' } });
  rec('users', 'PATCH /users/me', patchMe.status === 200, `status=${patchMe.status}`);
  const putSpecs = await call('PUT', '/users/me/specialities', { cookie: workerCookie, body: { specialityIds: [specId] } });
  rec('users', 'PUT /users/me/specialities', putSpecs.status === 200, `status=${putSpecs.status}`);
  const onboarding = await call('PATCH', '/users/me', { cookie: workerCookie, body: { onboardingCompleted: true } });
  rec('users', 'PATCH /users/me onboardingCompleted', onboarding.status === 200, `status=${onboarding.status}`);
  const exportData = await call('GET', '/users/me/export', { cookie: workerCookie });
  rec('users', 'GET /users/me/export (GDPR)', exportData.status === 200, `status=${exportData.status}`);
  const chgPw = await call('POST', '/users/me/password', { cookie: workerCookie, body: { currentPassword: 'nope', newPassword: 'Newpass123!' } });
  rec('users', 'POST /users/me/password rejects wrong current', chgPw.status === 401, `status=${chgPw.status}`);
  const adminUsers = await call('GET', '/users?page=1&limit=5', { cookie: adminCookie });
  rec('users', 'GET /users (admin)', adminUsers.status === 200, `status=${adminUsers.status}`);
  const workerUsers = await call('GET', '/users?page=1&limit=5', { cookie: workerCookie });
  rec('users', 'GET /users blocked for worker', workerUsers.status === 403, `status=${workerUsers.status}`);

  console.log('\n=== FEED / POSTS ===');
  const feed = await call('GET', '/posts/feed?limit=20', { cookie: workerCookie });
  rec('posts', 'GET /posts/feed', feed.status === 200, `status=${feed.status}`);
  const feedBody = feed.json?.data ?? feed.json;
  rec('posts', 'feed.items readable by frontend', Array.isArray(feedBody?.items),
    `keys=${JSON.stringify(Object.keys(feedBody || {}))}`);
  rec('posts', 'feed has nextCursor key', 'nextCursor' in (feedBody || {}), `nextCursor=${feedBody?.nextCursor}`);
  rec('posts', 'feed returns posts', (feedBody?.items || []).length > 0, `count=${feedBody?.items?.length}`);
  const firstPost = feedBody?.items?.[0];

  const browse = await call('GET', '/posts?page=1&limit=5');
  rec('posts', 'GET /posts (browse, public)', browse.status === 200, `status=${browse.status}`);
  const browseBody = browse.json?.data ?? browse.json;
  rec('posts', 'browse.items + total readable', Array.isArray(browseBody?.items) && typeof browseBody?.total === 'number',
    `keys=${JSON.stringify(Object.keys(browseBody || {}))}`);

  if (firstPost) {
    const detail = await call('GET', `/posts/${firstPost._id}`, { cookie: workerCookie });
    rec('posts', 'GET /posts/:id', detail.status === 200, `status=${detail.status}`);
    rec('posts', 'detail readable by frontend', !!(detail.json?.data?._id || detail.json?._id), '');
  }

  const browseCity = await call('GET', '/posts?city=Milano&page=1&limit=5');
  const cityBody = browseCity.json?.data ?? browseCity.json;
  rec('posts', 'browse filter by city', browseCity.status === 200, `returned=${cityBody?.total}`);

  const browseSpec = await call('GET', `/posts?specialityIds=${specId}&page=1&limit=5`);
  rec('posts', 'browse filter by speciality', browseSpec.status === 200, `status=${browseSpec.status}`);

  const browseText = await call('GET', '/posts?q=muratore&page=1&limit=5');
  rec('posts', 'browse text search q=', browseText.status === 200, `status=${browseText.status}`);

  const browseSalary = await call('GET', '/posts?sort=salary&page=1&limit=5');
  rec('posts', 'browse sort=salary', browseSalary.status === 200, `status=${browseSalary.status}`);

  if (firstPost) {
    const adminCreate = await call('POST', '/posts', {
      cookie: adminCookie,
      body: {
        title: 'Audit probe post',
        description: 'Created by audit probe to verify the write path.',
        specialityIds: [specId],
        location: { city: 'Milano', province: 'MI', country: 'Italia', remote: false },
        employmentType: 'full_time',
        company: { name: 'Audit Co' },
      },
    });
    rec('posts', 'POST /posts (admin create)', adminCreate.status === 201 || adminCreate.status === 200, `status=${adminCreate.status}`);
    const newPostId = (adminCreate.json?.data ?? adminCreate.json)?._id;
    if (newPostId) {
      const pub = await call('PATCH', `/posts/${newPostId}/status`, { cookie: adminCookie, body: { action: 'publish' } });
      rec('posts', 'PATCH /posts/:id/status publish', pub.status === 200, `status=${pub.status}`);
      const upd = await call('PATCH', `/posts/${newPostId}`, { cookie: adminCookie, body: { title: 'Audit probe post v2' } });
      rec('posts', 'PATCH /posts/:id update', upd.status === 200, `status=${upd.status}`);
      const arch = await call('PATCH', `/posts/${newPostId}/status`, { cookie: adminCookie, body: { action: 'archive' } });
      rec('posts', 'PATCH /posts/:id/status archive', arch.status === 200, `status=${arch.status}`);
      const del = await call('DELETE', `/posts/${newPostId}`, { cookie: adminCookie });
      rec('posts', 'DELETE /posts/:id', del.status === 200 || del.status === 204, `status=${del.status}`);
    }
  }

  const workerCreate = await call('POST', '/posts', {
    cookie: workerCookie,
    body: { title: 'x', description: 'x', specialityIds: [specId], location: { city: 'X' }, employmentType: 'full_time', company: { name: 'X' } },
  });
  rec('posts', 'POST /posts blocked for worker', workerCreate.status === 403, `status=${workerCreate.status}`);

  console.log('\n=== LIKES ===');
  if (firstPost) {
    const like = await call('POST', `/posts/${firstPost._id}/like`, { cookie: workerCookie });
    rec('likes', 'POST /posts/:id/like', like.status === 200 || like.status === 201, `status=${like.status}`);
    const ids = await call('GET', '/likes/ids', { cookie: workerCookie });
    rec('likes', 'GET /likes/ids', ids.status === 200, `status=${ids.status}`);
    rec('likes', 'likes/ids returns bare array', Array.isArray(ids.json), `isArray=${Array.isArray(ids.json)}`);
    const unlike = await call('DELETE', `/posts/${firstPost._id}/like`, { cookie: workerCookie });
    rec('likes', 'DELETE /posts/:id/like', unlike.status === 200 || unlike.status === 204, `status=${unlike.status}`);
  }

  console.log('\n=== APPLICATIONS ===');
  const mine = await call('GET', '/applications/me', { cookie: workerCookie });
  rec('applications', 'GET /applications/me', mine.status === 200, `status=${mine.status}`);
  rec('applications', 'applications/me returns bare array', Array.isArray(mine.json), `isArray=${Array.isArray(mine.json)}`);
  const mineList = mine.json?.data ?? mine.json;
  const myApp = Array.isArray(mineList) ? mineList[0] : null;

  // apply to a post the worker has not applied to yet
  const allPosts = (await call('GET', '/posts?page=1&limit=50')).json;
  const postList = allPosts?.data?.items ?? allPosts?.items ?? [];
  const appliedIds = new Set((Array.isArray(mineList) ? mineList : []).map((a) => String(a.postId)));
  const target = postList.find((p) => !appliedIds.has(String(p._id)));
  if (target) {
    const apply = await call('POST', `/applications/posts/${target._id}/apply`, {
      cookie: workerCookie,
      body: { coverLetter: 'Audit probe application.', contact: { email: 'marco@test.it' } },
    });
    rec('applications', 'POST /applications/posts/:id/apply', apply.status === 201 || apply.status === 200, `status=${apply.status}`);
    const dup = await call('POST', `/applications/posts/${target._id}/apply`, { cookie: workerCookie, body: {} });
    rec('applications', 'duplicate apply rejected', dup.status === 400 || dup.status === 409, `status=${dup.status}`);
    const newAppId = (apply.json?.data ?? apply.json)?._id;
    if (newAppId) {
      const wd = await call('POST', `/applications/${newAppId}/withdraw`, { cookie: workerCookie });
      rec('applications', 'POST /applications/:id/withdraw', wd.status === 200 || wd.status === 201, `status=${wd.status}`);
    }
  }

  const adminApps = await call('GET', '/applications?page=1&limit=5', { cookie: adminCookie });
  rec('applications', 'GET /applications (admin queue)', adminApps.status === 200, `status=${adminApps.status}`);
  const adminAppsBody = adminApps.json?.data ?? adminApps.json;
  rec('applications', 'admin applications items+total', Array.isArray(adminAppsBody?.items), `keys=${JSON.stringify(Object.keys(adminAppsBody || {}))}`);

  if (myApp) {
    const detail = await call('GET', `/applications/${myApp._id}`, { cookie: workerCookie });
    rec('applications', 'GET /applications/:id', detail.status === 200, `status=${detail.status}`);
  }

  const reviewerApp = adminAppsBody?.items?.find((a) => a.status === 'submitted');
  if (reviewerApp) {
    const review = await call('PATCH', `/applications/${reviewerApp._id}/status`, {
      cookie: adminCookie, body: { status: 'reviewed', reviewNotes: 'Audit probe review' },
    });
    rec('applications', 'PATCH /applications/:id/status', review.status === 200, `status=${review.status}`);
  }

  console.log('\n=== WORK HISTORY ===');
  const wh = await call('GET', '/work-history', { cookie: workerCookie });
  rec('work-history', 'GET /work-history', wh.status === 200, `status=${wh.status}`);
  rec('work-history', 'returns bare array', Array.isArray(wh.json), `isArray=${Array.isArray(wh.json)}`);
  const whCreate = await call('POST', '/work-history', {
    cookie: workerCookie,
    body: { positionTitle: 'Audit probe role', companyName: 'Audit Co', startDate: '2024-01-01', isCurrent: true, specialityIds: [specId] },
  });
  rec('work-history', 'POST /work-history', whCreate.status === 201 || whCreate.status === 200, `status=${whCreate.status}`);
  const whId = (whCreate.json?.data ?? whCreate.json)?._id;
  if (whId) {
    const wu = await call('PATCH', `/work-history/${whId}`, { cookie: workerCookie, body: { description: 'updated' } });
    rec('work-history', 'PATCH /work-history/:id', wu.status === 200, `status=${wu.status}`);
    const reorder = await call('POST', '/work-history/reorder', { cookie: workerCookie, body: { orderedIds: [whId] } });
    rec('work-history', 'POST /work-history/reorder', reorder.status === 200 || reorder.status === 201, `status=${reorder.status}`);
    const wd = await call('DELETE', `/work-history/${whId}`, { cookie: workerCookie });
    rec('work-history', 'DELETE /work-history/:id', wd.status === 200 || wd.status === 204, `status=${wd.status}`);
  }

  console.log('\n=== MESSAGES ===');
  const threads = await call('GET', '/messages/threads', { cookie: workerCookie });
  rec('messages', 'GET /messages/threads', threads.status === 200, `status=${threads.status}`);
  rec('messages', 'threads returns bare array', Array.isArray(threads.json), `isArray=${Array.isArray(threads.json)}`);
  const threadList = threads.json?.data ?? threads.json;
  const thread0 = Array.isArray(threadList) ? threadList[0] : null;
  if (thread0) {
    const msgs = await call('GET', `/messages/threads/${thread0._id}`, { cookie: workerCookie });
    rec('messages', 'GET /messages/threads/:id', msgs.status === 200, `status=${msgs.status}`);
    const send = await call('POST', `/messages/threads/${thread0._id}/messages`, { cookie: workerCookie, body: { body: 'Audit probe message' } });
    rec('messages', 'POST /messages/threads/:id/messages', send.status === 201 || send.status === 200, `status=${send.status}`);
    const read = await call('PATCH', `/messages/threads/${thread0._id}/read`, { cookie: workerCookie });
    rec('messages', 'PATCH /messages/threads/:id/read', read.status === 200 || read.status === 204, `status=${read.status}`);
  }
  const unread = await call('GET', '/messages/unread-count', { cookie: workerCookie });
  rec('messages', 'GET /messages/unread-count', unread.status === 200, `status=${unread.status}`);

  console.log('\n=== NOTIFICATIONS ===');
  const notifs = await call('GET', '/notifications', { cookie: workerCookie });
  rec('notifications', 'GET /notifications', notifs.status === 200, `status=${notifs.status}`);
  rec('notifications', 'returns bare array', Array.isArray(notifs.json), `isArray=${Array.isArray(notifs.json)}`);
  const ncount = await call('GET', '/notifications/unread-count', { cookie: workerCookie });
  rec('notifications', 'GET /notifications/unread-count', ncount.status === 200, `status=${ncount.status}`);
  const broadcast = await call('POST', '/notifications/broadcast', { cookie: adminCookie, body: { title: 'Audit', body: 'probe broadcast' } });
  rec('notifications', 'POST /notifications/broadcast (admin)', broadcast.status === 201 || broadcast.status === 200, `status=${broadcast.status}`);
  const broadcastWorker = await call('POST', '/notifications/broadcast', { cookie: workerCookie, body: { title: 'x', body: 'y' } });
  rec('notifications', 'broadcast blocked for worker', broadcastWorker.status === 403, `status=${broadcastWorker.status}`);
  const notifList = notifs.json?.data ?? notifs.json;
  if (Array.isArray(notifList) && notifList[0]) {
    const markOne = await call('PATCH', `/notifications/${notifList[0]._id}/read`, { cookie: workerCookie });
    rec('notifications', 'PATCH /notifications/:id/read', markOne.status === 200 || markOne.status === 204, `status=${markOne.status}`);
  }
  const markAll = await call('PATCH', '/notifications/read-all', { cookie: workerCookie });
  rec('notifications', 'PATCH /notifications/read-all', markAll.status === 200 || markAll.status === 204, `status=${markAll.status}`);

  console.log('\n=== FILES ===');
  const mineFiles = await call('GET', '/files/mine', { cookie: workerCookie });
  rec('files', 'GET /files/mine', mineFiles.status === 200, `status=${mineFiles.status}`);
  const fileList = mineFiles.json?.data ?? mineFiles.json;
  if (Array.isArray(fileList) && fileList[0]) {
    const fget = await call('GET', `/files/${fileList[0].id}`, { cookie: workerCookie });
    rec('files', 'GET /files/:id', fget.status === 200, `status=${fget.status}`);
  }
  const form = new FormData();
  form.append('file', new Blob([Buffer.from('audit probe text file')], { type: 'text/plain' }), 'probe.txt');
  const up = await call('POST', '/files/upload?purpose=resume', { cookie: workerCookie, form });
  rec('files', 'POST /files/upload', up.status === 201 || up.status === 200, `status=${up.status}`);
  const upId = (up.json?.data ?? up.json)?.id;
  if (upId) {
    const fdel = await call('DELETE', `/files/${upId}`, { cookie: workerCookie });
    rec('files', 'DELETE /files/:id', fdel.status === 200 || fdel.status === 204, `status=${fdel.status}`);
  }

  console.log('\n=== ADMIN ANALYTICS ===');
  const stats = await call('GET', '/admin/stats', { cookie: adminCookie });
  rec('admin', 'GET /admin/stats', stats.status === 200, `status=${stats.status}`);
  const funnel = await call('GET', '/admin/analytics/funnel', { cookie: adminCookie });
  rec('admin', 'GET /admin/analytics/funnel', funnel.status === 200, `status=${funnel.status}`);
  const demand = await call('GET', '/admin/analytics/specialities', { cookie: adminCookie });
  rec('admin', 'GET /admin/analytics/specialities', demand.status === 200, `status=${demand.status}`);
  const top = await call('GET', '/admin/analytics/top-posts', { cookie: adminCookie });
  rec('admin', 'GET /admin/analytics/top-posts', top.status === 200, `status=${top.status}`);
  const statsWorker = await call('GET', '/admin/stats', { cookie: workerCookie });
  rec('admin', 'admin stats blocked for worker', statsWorker.status === 403, `status=${statsWorker.status}`);

  console.log('\n=== AUDIT LOG ===');
  const auditReal = await call('GET', '/audit?page=1&limit=10', { cookie: adminCookie });
  rec('audit', 'GET /audit (actual backend route)', auditReal.status === 200, `status=${auditReal.status}`);
  const auditFrontend = await call('GET', '/admin/audit?page=1&limit=10', { cookie: adminCookie });
  rec('audit', 'GET /admin/audit (route frontend calls)', auditFrontend.status === 200,
    `status=${auditFrontend.status} <-- AdminAuditPage expects this`);

  console.log('\n=== NOT-FOUND / GUARDS ===');
  const bogus = await call('GET', '/does-not-exist');
  rec('misc', 'unknown path returns 404', bogus.status === 404, `status=${bogus.status}`);
  const noCookie = await call('GET', '/posts/feed');
  rec('misc', 'feed requires auth', noCookie.status === 401, `status=${noCookie.status}`);

  console.log('\n=== SUMMARY ===');
  const pass = results.filter((r) => r.ok === true).length;
  const fail = results.filter((r) => r.ok !== true && r.ok !== 'partial').length;
  const part = results.filter((r) => r.ok === 'partial').length;
  console.log(`PASS ${pass} | PARTIAL ${part} | FAIL ${fail} | TOTAL ${results.length}`);
  console.log('\n--- FAILURES ---');
  results.filter((r) => r.ok !== true && r.ok !== 'partial').forEach((r) => console.log(`[${r.area}] ${r.name} :: ${r.detail}`));
  require('fs').writeFileSync('/tmp/audit-results.json', JSON.stringify(results, null, 2));
})();
