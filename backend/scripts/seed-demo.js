/**
 * Demo dataset for end-to-end workflow testing.
 * Idempotent: every record is upserted on a stable key, so re-running is safe.
 * Run inside the api container:  node /app/seed-demo.js
 */
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const bcrypt = require('bcryptjs');

const URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/worker_platform';
const PASSWORD = 'Worker123!';
const DAY = 86400000;
const now = Date.now();
const daysAgo = (n) => new Date(now - n * DAY);
const daysAhead = (n) => new Date(now + n * DAY);
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

const USERS = [
  // ── Profile states ───────────────────────────────────────────────
  { email: 'demo.new@test.it', fullName: 'Nuovo Candidato', city: 'Milano', province: 'MI', specs: [], onboarding: false, years: 0 },
  { email: 'demo.noresume@test.it', fullName: 'Senza Curriculum', city: 'Roma', province: 'RM', specs: ['edilizia'], onboarding: true, years: 3, noResume: true },
  { email: 'demo.blocked@test.it', fullName: 'Utente Disattivato', city: 'Torino', province: 'TO', specs: ['elettrica'], onboarding: true, years: 5, isActive: false },
  { email: 'demo.deleted@test.it', fullName: 'Utente Cancellato', city: 'Napoli', province: 'NA', specs: ['generico'], onboarding: true, years: 2, deleted: true },
  { email: 'demo.unavailable@test.it', fullName: 'Occupato Altrove', city: 'Bologna', province: 'BO', specs: ['meccanica'], onboarding: true, years: 9, avail: 'not_available' },

  // ── Happy path (accepted + thread) ───────────────────────────────
  { email: 'demo.accepted@test.it', fullName: 'Andrea Ferrari', city: 'Milano', province: 'MI', specs: ['edilizia'], onboarding: true, years: 6, avail: 'immediate', phone: '+39 340 1112233' },

  // ── Review queue ─────────────────────────────────────────────────
  { email: 'demo.review1@test.it', fullName: 'Chiara Gallo', city: 'Torino', province: 'TO', specs: ['elettrica'], onboarding: true, years: 4, avail: 'two_weeks' },
  { email: 'demo.review2@test.it', fullName: 'Youssef Ben Ali', city: 'Roma', province: 'RM', specs: ['meccanica'], onboarding: true, years: 7, avail: 'immediate' },
  { email: 'demo.review3@test.it', fullName: 'Elena Ricci', city: 'Firenze', province: 'FI', specs: ['artigianato'], onboarding: true, years: 11, avail: 'one_month' },

  // ── Rejected / withdrawn history ─────────────────────────────────
  { email: 'demo.rejected@test.it', fullName: 'Paolo Greco', city: 'Napoli', province: 'NA', specs: ['generico'], onboarding: true, years: 1, avail: 'immediate' },
  { email: 'demo.withdrawn@test.it', fullName: 'Ilaria Conti', city: 'Verona', province: 'VR', specs: ['edilizia'], onboarding: true, years: 5, avail: 'immediate' },

  // ── Bulk workers for pagination / search ─────────────────────────
  ...[
    ['Simone Bruno', 'Milano', 'MI', 'edilizia', 'immediate'],
    ['Martina De Luca', 'Roma', 'RM', 'elettrica', 'two_weeks'],
    ['Karim Haddad', 'Torino', 'TO', 'meccanica', 'immediate'],
    ['Valentina Serra', 'Cagliari', 'CA', 'artigianato', 'one_month'],
    ['Gabriele Fontana', 'Brescia', 'BS', 'industriale', 'immediate'],
    ['Nadia El Amrani', 'Bologna', 'BO', 'automotive', 'two_weeks'],
    ['Federico Marchetti', 'Padova', 'PD', 'edilizia', 'immediate'],
    ['Sonia Vitale', 'Palermo', 'PA', 'generico', 'not_available'],
    ['Omar Toure', 'Prato', 'PO', 'industriale', 'immediate'],
    ['Rebecca Costa', 'Genova', 'GE', 'elettrica', 'one_month'],
  ].map(([fullName, city, province, spec, avail], i) => ({
    email: `demo.bulk${i + 1}@test.it`, fullName, city, province,
    specs: [spec], onboarding: true, years: 2 + i, avail,
  })),
];

const COMPANIES = [
  ['EdilCostruzioni Srl', 'Edilizia', 'Milano', 'https://edilcostruzioni.it'],
  ['TechImpianti SpA', 'Impiantistica', 'Torino', 'https://techimpianti.it'],
  ['AutoService Group', 'Automotive', 'Bologna', 'https://autoservice.it'],
  ['GreenEnergy Italia', 'Energia', 'Roma', 'https://greenenergy.it'],
  ['PuliziePro Cooperative', 'Servizi', 'Napoli', 'https://puliziepro.it'],
  ['Artigiani del Legno', 'Artigianato', 'Firenze', 'https://artigianilegno.it'],
  ['Logistica Adriatica', 'Logistica', 'Ancona', 'https://logisticaadriatica.it'],
  ['NordMetalli Srl', 'Metalmeccanica', 'Bergamo', 'https://nordmetalli.it'],
];

const POSTS = [
  // ── Published, open, healthy ─────────────────────────────────────
  { title: 'Muratore specializzato – ristrutturazione uffici', cat: 'edilizia', city: 'Milano', type: 'full_time', contract: 'fixed_term', salary: [1900, 2300], status: 'published', days: 2, deadline: 28, openings: 4, featured: true },
  { title: 'Elettricista civile – impianti domotici', cat: 'elettrica', city: 'Roma', type: 'full_time', contract: 'permanent', salary: [1700, 2000], status: 'published', days: 5, deadline: 25, openings: 2 },
  { title: 'Saldatore MIG – turni notturni', cat: 'meccanica', city: 'Bergamo', type: 'full_time', contract: 'permanent', salary: [1800, 2200], status: 'published', days: 1, deadline: 29, openings: 3, urgent: true },
  { title: 'Giardiniere – manutenzione condomini', cat: 'artigianato', city: 'Firenze', type: 'part_time', contract: 'fixed_term', salary: [700, 900], status: 'published', days: 8, deadline: 22, openings: 2 },
  { title: 'Carrozziere – officina autorizzata', cat: 'automotive', city: 'Bologna', type: 'full_time', contract: 'permanent', salary: [1500, 1800], status: 'published', days: 12, deadline: 18, openings: 1 },
  { title: 'Operatore logistico – magazzino ricambi', cat: 'generico', city: 'Ancona', type: 'temporary', contract: 'fixed_term', salary: [1250, 1450], status: 'published', days: 3, deadline: 27, openings: 10, urgent: true },
  { title: 'Manutentore industriale – linea packaging', cat: 'industriale', city: 'Brescia', type: 'full_time', contract: 'permanent', salary: [1650, 1950], status: 'published', days: 6, deadline: 24, openings: 2 },

  // ── Deadline edge cases ─────────────────────────────────────────
  { title: 'Carpentiere edile – cantiere scaduto', cat: 'edilizia', city: 'Torino', type: 'full_time', contract: 'fixed_term', salary: [1800, 2100], status: 'published', days: 45, deadline: -3, openings: 2 },
  { title: 'Aiuto muratore – scadenza oggi', cat: 'edilizia', city: 'Milano', type: 'seasonal', contract: 'seasonal', salary: [1300, 1500], status: 'published', days: 20, deadline: 0, openings: 5 },

  // ── Lifecycle states for admin testing ──────────────────────────
  { title: 'Idraulico – bozza in preparazione', cat: 'artigianato', city: 'Verona', type: 'full_time', contract: 'permanent', salary: [1500, 1750], status: 'draft', days: 0, openings: 1 },
  { title: 'Verniciatore industriale – chiuso', cat: 'automotive', city: 'Torino', type: 'full_time', contract: 'permanent', salary: [1500, 1700], status: 'closed', days: 40, deadline: 5, openings: 1 },
  { title: 'Escavatorista – archiviato', cat: 'edilizia', city: 'Cagliari', type: 'full_time', contract: 'fixed_term', salary: [1700, 2000], status: 'archived', days: 90, openings: 1 },
  { title: 'Tornitore CNC – noleggio', cat: 'industriale', city: 'Padova', type: 'contract', contract: 'noleggio', salary: [2000, 2400], status: 'published', days: 4, deadline: 26, openings: 2 },
  { title: 'Apprendista elettricista – stage', cat: 'elettrica', city: 'Genova', type: 'internship', contract: 'stage', salary: [500, 700], status: 'published', days: 7, deadline: 23, openings: 3 },

  // ── Volume for feed / browse pagination ─────────────────────────
  ...Array.from({ length: 45 }, (_, i) => {
    const cats = ['edilizia', 'elettrica', 'meccanica', 'artigianato', 'automotive', 'industriale', 'generico'];
    const cat = cats[i % cats.length];
    const [name, , city] = COMPANIES[i % COMPANIES.length];
    return {
      title: `Posizione demo #${String(i + 1).padStart(2, '0')} – ${cat}`,
      cat, city, type: i % 4 === 0 ? 'part_time' : 'full_time',
      contract: i % 3 === 0 ? 'fixed_term' : 'permanent',
      salary: [1200 + i * 10, 1500 + i * 10],
      status: i < 40 ? 'published' : 'draft',
      days: i % 60, deadline: (i % 30) + 3, openings: 1 + (i % 5),
      featured: i % 11 === 0,
      company: name,
    };
  }),
];

async function main() {
  await mongoose.connect(URI);
  const db = mongoose.connection.db;
  const users = db.collection('users');
  const posts = db.collection('posts');
  const apps = db.collection('applications');
  const convos = db.collection('conversations');
  const msgs = db.collection('messages');
  const files = db.collection('fileassets');
  const notifs = db.collection('notifications');
  const audits = db.collection('auditlogs');
  const likes = db.collection('likes');
  const specs = db.collection('specialities');

  const allSpecs = await specs.find({ isActive: true }).toArray();
  if (!allSpecs.length) throw new Error('No specialities found — run `npm run seed` first');
  const firstByCat = new Map();
  for (const s of allSpecs) if (!firstByCat.has(s.category)) firstByCat.set(s.category, s);

  const admin = await users.findOne({ role: 'admin', deletedAt: null });
  if (!admin) throw new Error('No admin user — run `npm run seed` first');

  // ── Users ────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const userIds = new Map();
  for (const u of USERS) {
    const doc = {
      email: u.email.toLowerCase(),
      passwordHash,
      role: 'worker',
      fullName: u.fullName,
      age: null,
      phone: u.phone || null,
      city: u.city,
      province: u.province,
      address: null,
      avatarUrl: null,
      bio: u.specs.length ? `${u.fullName}: profilo demo con ${u.years} anni di esperienza.` : null,
      birthDate: null,
      specialityIds: u.specs.map((c) => firstByCat.get(c)?._id).filter(Boolean),
      yearsExperience: u.years,
      certifications: u.years > 5 ? ['Sicurezza sul lavoro'] : [],
      languages: ['Italiano'],
      hasDriversLicence: u.years > 3,
      availability: u.avail || 'immediate',
      resumeFileId: null,
      onboardingCompleted: u.onboarding,
      isActive: u.isActive !== false && !u.deleted,
      emailVerified: true,
      lastLoginAt: u.deleted ? daysAgo(40) : daysAgo(Math.floor(Math.random() * 20)),
      deletedAt: u.deleted ? daysAgo(3) : null,
      deletedBy: u.deleted ? admin._id : null,
      updatedAt: new Date(),
    };
    await users.updateOne({ email: doc.email }, { $set: doc, $setOnInsert: { createdAt: daysAgo(60) } }, { upsert: true });
    const saved = await users.findOne({ email: doc.email }, { projection: { _id: 1 } });
    userIds.set(u.email, saved._id);
  }

  // ── Resumes (skipped for demo.noresume / incomplete / deleted) ───
  for (const u of USERS) {
    if (u.noResume || !u.onboarding || u.deleted) continue;
    const uid = userIds.get(u.email);
    const key = `demo/resumes/${slugify(u.email)}.pdf`;
    const doc = {
      ownerType: 'user', ownerId: uid, purpose: 'resume', storageKey: key, provider: 'disk',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      originalName: `CV_${u.fullName.replace(/\s+/g, '_')}.pdf`,
      mimeType: 'application/pdf', extension: 'pdf', sizeBytes: 210000 + Math.floor(Math.random() * 300000),
      checksum: `sha256-${slugify(u.email)}`, isImage: false, scanStatus: 'clean', visibility: 'employer',
      deletedAt: null, updatedAt: new Date(),
    };
    await files.updateOne({ storageKey: key }, { $set: doc, $setOnInsert: { createdAt: daysAgo(30) } }, { upsert: true });
    const f = await files.findOne({ storageKey: key }, { projection: { _id: 1 } });
    await users.updateOne({ _id: uid }, { $set: { resumeFileId: f._id } });
    userIds.set(`${u.email}#resume`, f._id);
  }

  // ── Posts ────────────────────────────────────────────────────────
  const postIds = new Map();
  for (let i = 0; i < POSTS.length; i++) {
    const p = POSTS[i];
    const spec = firstByCat.get(p.cat) || allSpecs[0];
    const [companyName, sector, city] = p.company ? [p.company, 'Servizi', p.city] : COMPANIES[i % COMPANIES.length];
    const slug = slugify(p.title);
    const publishedAt = p.status === 'published' || p.status === 'closed' || p.status === 'archived' ? daysAgo(p.days) : null;
    const doc = {
      title: p.title, slug,
      summary: `${p.title} — ${city}. Posizione demo per test dei flussi.`,
      description: `Cerchiamo ${p.cat} per ${companyName} a ${city}.\n\nQuesta posizione fa parte del dataset demo: serve a verificare filtri, candidature, scadenze e ciclo di vita dell'annuncio.`,
      requirements: ['Esperienza nel settore', 'Disponibilità secondo contratto'],
      benefits: ['Contratto regolare', 'Formazione iniziale'],
      specialityIds: [spec._id, ...(firstByCat.get(p.cat) !== spec ? [] : [])],
      location: { city, province: null, country: 'IT', remote: false },
      employmentType: p.type, contractType: p.contract,
      salary: { min: p.salary[0], max: p.salary[1], currency: 'EUR', period: 'monthly', isNegotiable: false },
      schedule: { shift: 'day', hoursPerWeek: p.type === 'part_time' ? 20 : 40 },
      company: { name: companyName, sector, size: '50-200 dipendenti', website: `https://${slugify(companyName)}.it` },
      coverFileId: null, galleryFileIds: [], attachments: [],
      status: p.status, publishedAt,
      applicationDeadline: p.deadline === undefined ? null : (p.deadline < 0 ? daysAgo(-p.deadline) : daysAhead(p.deadline)),
      startDate: null, openings: p.openings || 1,
      isFeatured: !!p.featured, isUrgent: !!p.urgent,
      createdBy: admin._id, updatedBy: admin._id,
      stats: { views: 20 + ((i * 37) % 480), likes: (i * 13) % 40, applications: 0 },
      deletedAt: p.status === 'archived' && i === 11 ? null : null,
      updatedAt: new Date(),
    };
    await posts.updateOne({ slug }, { $set: doc, $setOnInsert: { createdAt: publishedAt || new Date() } }, { upsert: true });
    const saved = await posts.findOne({ slug }, { projection: { _id: 1 } });
    postIds.set(p.title, saved._id);
  }

  // ── Applications ────────────────────────────────────────────────
  const postDocs = await posts.find({ slug: { $exists: true } }, { projection: { _id: 1, title: 1, slug: 1, company: 1, location: 1, employmentType: 1, specialityIds: 1 } }).toArray();
  const specById = new Map(allSpecs.map((s) => [s._id.toString(), s.name]));

  const appSpec = [
    // email, target post title, status, daysAgo
    ['demo.new@test.it', null, null, 0],
    ['demo.accepted@test.it', 'Muratore specializzato – ristrutturazione uffici', 'accepted', 14],
    ['demo.review1@test.it', 'Elettricista civile – impianti domotici', 'submitted', 2],
    ['demo.review1@test.it', 'Saldatore MIG – turni notturni', 'reviewed', 6],
    ['demo.review2@test.it', 'Saldatore MIG – turni notturni', 'submitted', 3],
    ['demo.review2@test.it', 'Tornitore CNC – noleggio', 'submitted', 1],
    ['demo.review3@test.it', 'Giardiniere – manutenzione condomini', 'submitted', 4],
    ['demo.review3@test.it', 'Carrozziere – officina autorizzata', 'reviewed', 9],
    ['demo.rejected@test.it', 'Operatore logistico – magazzino ricambi', 'rejected', 11],
    ['demo.withdrawn@test.it', 'Carpentiere edile – cantiere scaduto', 'withdrawn', 20],
    ['demo.bulk1@test.it', 'Muratore specializzato – ristrutturazione uffici', 'submitted', 5],
    ['demo.bulk2@test.it', 'Elettricista civile – impianti domotici', 'accepted', 16],
    ['demo.bulk3@test.it', 'Saldatore MIG – turni notturni', 'rejected', 8],
    ['demo.bulk4@test.it', 'Giardiniere – manutenzione condomini', 'reviewed', 7],
    ['demo.bulk5@test.it', 'Manutentore industriale – linea packaging', 'submitted', 2],
    ['demo.bulk6@test.it', 'Carrozziere – officina autorizzata', 'submitted', 6],
    ['demo.bulk7@test.it', 'Muratore specializzato – ristrutturazione uffici', 'submitted', 1],
    ['demo.bulk8@test.it', 'Operatore logistico – magazzino ricambi', 'accepted', 13],
  ];
  const createdApps = [];
  for (const [email, postTitle, status] of appSpec) {
    const userId = userIds.get(email);
    if (!userId || !postTitle) continue;
    const post = postDocs.find((p) => p.title === postTitle);
    if (!post) continue;
    const appliedAt = daysAgo(2 + (createdApps.length % 15));
    const specNames = (post.specialityIds || []).map((id) => specById.get(id.toString())).filter(Boolean);
    const history = [{ to: 'submitted', actorId: userId, actorRole: 'worker', at: appliedAt }];
    let reviewedBy = null, reviewedAt = null, reviewNotes = null, withdrawnAt = null;
    if (status !== 'submitted') {
      reviewedAt = new Date(appliedAt.getTime() + 2 * DAY);
      reviewedBy = admin._id;
      history.push({ from: 'submitted', to: 'reviewed', actorId: admin._id, actorRole: 'admin', note: 'Candidatura esaminata', at: reviewedAt });
    }
    if (status === 'accepted') history.push({ from: 'reviewed', to: 'accepted', actorId: admin._id, actorRole: 'admin', note: 'Profilo idoneo', at: new Date(reviewedAt.getTime() + DAY) });
    if (status === 'rejected') { reviewNotes = 'Posizione coperta internamente'; history.push({ from: 'reviewed', to: 'rejected', actorId: admin._id, actorRole: 'admin', note: reviewNotes, at: new Date(reviewedAt.getTime() + DAY) }); }
    if (status === 'withdrawn') { withdrawnAt = new Date(appliedAt.getTime() + 3 * DAY); history.push({ from: 'submitted', to: 'withdrawn', actorId: userId, actorRole: 'worker', at: withdrawnAt }); }

    const doc = {
      postId: post._id, userId,
      snapshot: { postTitle: post.title, postSlug: post.slug, companyName: post.company?.name, city: post.location?.city, specialityNames: specNames, employmentType: post.employmentType },
      coverLetter: status === 'submitted' ? 'Mi candido con interesse; esperienza verificabile e disponibilità immediata.' : null,
      attachmentFileIds: [], resumeFileId: userIds.get(`${email}#resume`) || null,
      status, statusHistory: history, reviewedBy, reviewedAt, reviewNotes,
      threadId: null,
      contact: { phone: '+39 340 0000000', email, availabilityNote: 'Disponibile da subito' },
      appliedAt, withdrawnAt, updatedAt: new Date(),
    };
    await apps.updateOne({ userId, postId: post._id }, { $set: doc, $setOnInsert: { createdAt: appliedAt } }, { upsert: true });
    const saved = await apps.findOne({ userId, postId: post._id }, { projection: { _id: 1 } });
    createdApps.push({ ...doc, _id: saved._id, email, postTitle: post.title });
  }

  // ── Applications at volume (paginated admin queue) ───────────────
  const bulkWorkers = USERS.filter((u) => u.email.startsWith('demo.bulk'));
  const livePosts = postDocs.filter((p) => p.title.startsWith('Posizione demo'));
  let bulkCount = 0;
  for (let i = 0; i < 120; i++) {
    const w = bulkWorkers[i % bulkWorkers.length];
    const p = livePosts[i % livePosts.length];
    const userId = userIds.get(w.email);
    if (!userId) continue;
    const appliedAt = daysAgo(30 - (i % 30));
    const statuses = ['submitted', 'submitted', 'reviewed', 'accepted', 'rejected'];
    const status = statuses[i % statuses.length];
    const specNames = (p.specialityIds || []).map((id) => specById.get(id.toString())).filter(Boolean);
    const history = [{ to: 'submitted', actorId: userId, actorRole: 'worker', at: appliedAt }];
    if (status !== 'submitted') history.push({ from: 'submitted', to: status, actorId: admin._id, actorRole: 'admin', at: new Date(appliedAt.getTime() + DAY) });
    const doc = {
      postId: p._id, userId,
      snapshot: { postTitle: p.title, postSlug: p.slug, companyName: p.company?.name, city: p.location?.city, specialityNames: specNames, employmentType: p.employmentType },
      coverLetter: null, attachmentFileIds: [], resumeFileId: userIds.get(`${w.email}#resume`) || null,
      status, statusHistory: history,
      reviewedBy: status === 'submitted' ? null : admin._id,
      reviewedAt: status === 'submitted' ? null : new Date(appliedAt.getTime() + DAY),
      reviewNotes: null, threadId: null, contact: { email: w.email },
      appliedAt, withdrawnAt: null, updatedAt: new Date(),
    };
    await apps.updateOne({ userId, postId: p._id }, { $set: doc, $setOnInsert: { createdAt: appliedAt } }, { upsert: true });
    bulkCount++;
  }

  // ── Conversations + messages ────────────────────────────────────
  const acceptedApp = createdApps.find((a) => a.status === 'accepted' && a.email === 'demo.accepted@test.it');
  if (acceptedApp) {
    const threadKey = { applicationId: acceptedApp._id };
    await convos.updateOne(threadKey, {
      $set: {
        participants: [acceptedApp.userId, admin._id], applicationId: acceptedApp._id, postId: acceptedApp.postId,
        context: 'application', lastMessage: 'Perfetto, ci vediamo lunedì in cantiere.', lastMessageAt: daysAgo(1),
        lastSenderId: admin._id, unreadCounts: { [acceptedApp.userId.toString()]: 1 }, isClosed: false, closedBy: null, updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: daysAgo(13) },
    }, { upsert: true });
    const thread = await convos.findOne(threadKey);
    await apps.updateOne({ _id: acceptedApp._id }, { $set: { threadId: thread._id } });
    const convo = [
      [admin._id, acceptedApp.userId, 'Buongiorno Andrea, la sua candidatura è accettata. Possiamo fissare un colloquio?', 5],
      [acceptedApp.userId, admin._id, 'Certo, sono disponibile da domani mattina.', 4],
      [admin._id, acceptedApp.userId, 'Perfetto, ci vediamo lunedì in cantiere.', 1],
    ];
    for (const [senderId, recipientId, body, d] of convo) {
      await msgs.updateOne({ threadId: thread._id, body }, { $set: { threadId: thread._id, senderId, recipientId, body, attachments: [], readAt: daysAgo(1), sentAt: daysAgo(d), deletedAt: null } }, { upsert: true });
    }
  }

  // Direct thread with unread badge
  const dmA = userIds.get('demo.bulk1@test.it');
  const dmB = userIds.get('demo.bulk2@test.it');
  if (dmA && dmB) {
    const key = { context: 'direct', participants: [dmA, dmB] };
    await convos.updateOne(key, {
      $set: { participants: [dmA, dmB], context: 'direct', lastMessage: 'Mi passi il contatto del capocantiere?', lastMessageAt: daysAgo(0.2), lastSenderId: dmB, unreadCounts: { [dmA.toString()]: 2 }, isClosed: false, updatedAt: new Date() },
      $setOnInsert: { createdAt: daysAgo(2) },
    }, { upsert: true });
    const t = await convos.findOne(key);
    await msgs.updateOne({ threadId: t._id, body: 'Ciao Simone, hai novità sul cantiere di Monza?' }, { $set: { threadId: t._id, senderId: dmA, recipientId: dmB, body: 'Ciao Simone, hai novità sul cantiere di Monza?', attachments: [], readAt: daysAgo(1), sentAt: daysAgo(1) } }, { upsert: true });
    await msgs.updateOne({ threadId: t._id, body: 'Mi passi il contatto del capocantiere?' }, { $set: { threadId: t._id, senderId: dmB, recipientId: dmA, body: 'Mi passi il contatto del capocantiere?', attachments: [], readAt: null, sentAt: daysAgo(0.2) } }, { upsert: true });
  }

  // Closed admin thread (dimmed state)
  const closedWith = userIds.get('demo.review3@test.it');
  if (closedWith) {
    const key = { context: 'admin_contact', participants: [closedWith, admin._id] };
    await convos.updateOne(key, {
      $set: { participants: [closedWith, admin._id], context: 'admin_contact', postId: null, applicationId: null, lastMessage: 'Thread chiuso: documenti ricevuti.', lastMessageAt: daysAgo(9), lastSenderId: admin._id, unreadCounts: {}, isClosed: true, closedBy: admin._id, updatedAt: new Date() },
      $setOnInsert: { createdAt: daysAgo(10) },
    }, { upsert: true });
    const t = await convos.findOne(key);
    await msgs.updateOne({ threadId: t._id, body: 'Thread chiuso: documenti ricevuti.' }, { $set: { threadId: t._id, senderId: admin._id, recipientId: closedWith, body: 'Thread chiuso: documenti ricevuti.', attachments: [], readAt: daysAgo(9), sentAt: daysAgo(9) } }, { upsert: true });
  }

  // ── Notifications (read + unread, all valid types) ───────────────
  const notifSpec = [
    ['demo.accepted@test.it', 'application_accepted', 'Candidatura accettata', 'La tua candidatura per "Muratore specializzato" è stata accettata.', false],
    ['demo.accepted@test.it', 'new_message', 'Nuovo messaggio', 'Hai un nuovo messaggio da Platform Admin.', false],
    ['demo.review1@test.it', 'application_status', 'Candidatura in revisione', 'La tua candidatura è stata presa in carico.', false],
    ['demo.rejected@test.it', 'application_rejected', 'Candidatura non selezionata', 'La posizione è stata coperta internamente.', true],
    ['demo.bulk1@test.it', 'new_post_matching', 'Nuova opportunità per te', 'Un annuncio corrisponde alle tue specialità.', false],
    ['demo.bulk2@test.it', 'admin_broadcast', 'Manutenzione programmata', 'La piattaforma sarà in manutenzione domenica 02:00-04:00.', true],
    ['demo.bulk1@test.it', 'account', 'Profilo verificato', 'Il tuo profilo è stato verificato dal team.', true],
    ['demo.unavailable@test.it', 'new_message', 'Messaggio in attesa', 'Hai 1 messaggio non letto.', false],
  ];
  for (const [email, type, title, body, read] of notifSpec) {
    const userId = userIds.get(email);
    if (!userId) continue;
    await notifs.updateOne({ userId, type, title }, { $set: { userId, type, title, body, data: {}, readAt: read ? daysAgo(1) : null, updatedAt: new Date() }, $setOnInsert: { createdAt: daysAgo(2) } }, { upsert: true });
  }

  // ── Likes ───────────────────────────────────────────────────────
  for (const p of postDocs.slice(0, 12)) {
    const w = userIds.get('demo.bulk1@test.it');
    if (!w) continue;
    await likes.updateOne({ userId: w, postId: p._id }, { $setOnInsert: { userId: w, postId: p._id, likedAt: daysAgo(3), createdAt: daysAgo(3), updatedAt: daysAgo(3) } }, { upsert: true });
  }

  // ── Audit log ───────────────────────────────────────────────────
  const auditSpec = [
    ['post.create', 'post', 0], ['post.publish', 'post', 1], ['post.close', 'post', 10],
    ['application.status', 'application', 3], ['user.deactivate', 'user', 2], ['speciality.update', 'speciality', 5],
  ];
  for (const [action, entity, idx] of auditSpec) {
    await audits.updateOne({ action, entity, 'after.seedMarker': 'demo' }, {
      $set: {
        actorId: admin._id, actorRole: 'admin', action, entity,
        entityId: idx < postDocs.length ? postDocs[idx]._id : null,
        before: action.endsWith('update') ? { isActive: true } : null,
        after: { seedMarker: 'demo' },
        ip: '15.188.73.141', userAgent: 'seed-demo', updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: daysAgo(4) },
    }, { upsert: true });
  }

  // ── Backfill: older applications shipped with empty specialityNames ──
  const legacyApps = await apps.find({ 'snapshot.specialityNames': { $size: 0 } }).toArray();
  for (const a of legacyApps) {
    const post = postDocs.find((p) => p._id.equals(a.postId));
    if (!post) continue;
    const names = (post.specialityIds || []).map((id) => specById.get(id.toString())).filter(Boolean);
    if (names.length) await apps.updateOne({ _id: a._id }, { $set: { 'snapshot.specialityNames': names } });
  }
  if (legacyApps.length) console.log(`✅ Backfilled specialityNames on ${legacyApps.length} legacy applications`);

  // ── Derived counters ────────────────────────────────────────────
  for (const p of postDocs) {
    const n = await apps.countDocuments({ postId: p._id });
    await posts.updateOne({ _id: p._id }, { $set: { 'stats.applications': n } });
  }
  for (const s of allSpecs) {
    const postCount = await posts.countDocuments({ specialityIds: s._id, status: 'published' });
    const workerCount = await users.countDocuments({ specialityIds: s._id, role: 'worker', isActive: true });
    await specs.updateOne({ _id: s._id }, { $set: { postCount, workerCount } });
  }

  // ── Verification ────────────────────────────────────────────────
  const counts = {
    users: await users.countDocuments({ deletedAt: null }),
    workers: await users.countDocuments({ role: 'worker', deletedAt: null }),
    posts: await posts.countDocuments({ deletedAt: null }),
    published: await posts.countDocuments({ status: 'published', deletedAt: null }),
    applications: await apps.countDocuments(),
    conversations: await convos.countDocuments(),
    messages: await msgs.countDocuments(),
    notifications: await notifs.countDocuments(),
    likes: await likes.countDocuments(),
    audits: await audits.countDocuments(),
  };
  const badSnapshots = await apps.countDocuments({ 'snapshot.specialityNames': { $size: 0 } });
  const orphanApps = createdApps.length
    ? await apps.countDocuments({ postId: { $nin: postDocs.map((p) => p._id) } })
    : 0;
  console.log(JSON.stringify({ counts, badSnapshots, orphanApps }, null, 2));
  if (badSnapshots) console.warn(`⚠️  ${badSnapshots} applications have empty specialityNames — admin demand report will under-count`);
  if (orphanApps) console.warn(`⚠️  ${orphanApps} applications reference a missing post`);

  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
