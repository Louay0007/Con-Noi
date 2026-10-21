import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../../app.module';
import { SpecialitiesService } from '../specialities/specialities.service';
import { UsersService } from '../users/users.service';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Post, PostDocument } from '../posts/schemas/post.schema';
import { Application, ApplicationDocument } from '../applications/schemas/application.schema';
import { Conversation, ConversationDocument } from '../messages/schemas/conversation.schema';
import { Message, MessageDocument } from '../messages/schemas/message.schema';
import { FileAsset, FileAssetDocument } from '../files/schemas/file-asset.schema';
import { MatchingService } from '../matching/matching.service';

// ── Image URLs (Unsplash – free, reliable, high-quality) ──────────
const AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=200&h=200&fit=crop&crop=face',
];

const POST_COVERS = [
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1565514020176-db792083e3a7?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1590644365607-1c5a38fc6fbf?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=400&fit=crop',
];

const COMPANY_LOGOS = [
  'https://images.unsplash.com/photo-1560179707-f14e90ef3dab?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100&h=100&fit=crop',
];

// ── Seed Data Definitions ─────────────────────────────────────────
const WORKER_DATA = [
  { name: 'Marco Rossi', email: 'marco@test.it', city: 'Milano', province: 'MI', bio: 'Muratore esperto con 10 anni di esperienza in edilizia residenziale e commerciale.', specs: ['edilizia'], exp: 10, certs: ['Sicurezza sul lavoro', 'Patente muletto'], langs: ['Italiano', 'Romeno'], avail: 'immediate', phone: '+39 333 1234567' },
  { name: 'Giulia Bianchi', email: 'giulia@test.it', city: 'Roma', province: 'RM', bio: 'Elettricista certificata, specializzata in impianti civili e industriali.', specs: ['elettrica'], exp: 7, certs: ['Certificazione FGAS', 'Primo soccorso'], langs: ['Italiano', 'Inglese'], avail: 'two_weeks', phone: '+39 333 2345678' },
  { name: 'Ahmed Hassan', email: 'ahmed@test.it', city: 'Torino', province: 'TO', bio: 'Saldatore TIG/MIG con esperienza in carpenteria metallica pesante.', specs: ['meccanica'], exp: 5, certs: ['Patentino saldatura'], langs: ['Italiano', 'Arabo'], avail: 'immediate', phone: '+39 333 3456789' },
  { name: 'Luca Verdi', email: 'luca@test.it', city: 'Bologna', province: 'BO', bio: 'Idraulico specializzato in impianti termoidraulici e condizionamento.', specs: ['artigianato'], exp: 8, certs: ['Abilitazione impiantistica', 'F-Gas'], langs: ['Italiano'], avail: 'one_month', phone: '+39 333 4567890' },
  { name: 'Francesca Neri', email: 'francesca@test.it', city: 'Firenze', province: 'FI', bio: 'Imbianchina e decoratrice d\'interni con attenzione ai dettagli.', specs: ['edilizia'], exp: 4, certs: ['Sicurezza sul lavoro'], langs: ['Italiano', 'Spagnolo'], avail: 'immediate', phone: '+39 333 5678901' },
  { name: 'Davide Colombo', email: 'davide@test.it', city: 'Napoli', province: 'NA', bio: 'Meccanico auto e moto, diagnosi elettronica e riparazioni generali.', specs: ['automotive'], exp: 12, certs: ['Diagnosi OBD', 'Climatizzazione auto'], langs: ['Italiano'], avail: 'two_weeks', phone: '+39 333 6789012' },
  { name: 'Sara Moretti', email: 'sara@test.it', city: 'Verona', province: 'VR', bio: 'Addetta alle pulizie industriali e sanificazione ambienti.', specs: ['pulizia'], exp: 3, certs: ['HACCP'], langs: ['Italiano', 'Ucraino'], avail: 'immediate', phone: '+39 333 7890123' },
  { name: 'Roberto Esposito', email: 'roberto@test.it', city: 'Palermo', province: 'PA', bio: 'Falegname artigiano, mobili su misura e restauro.', specs: ['legno'], exp: 15, certs: ['Sicurezza macchine utensili'], langs: ['Italiano'], avail: 'not_available', phone: '+39 333 8901234' },
];

const COMPANIES = [
  { name: 'EdilCostruzioni Srl', sector: 'Edilizia', size: '50-200 dipendenti', website: 'https://edilcostruzioni.it', city: 'Milano' },
  { name: 'TechImpianti SpA', sector: 'Impiantistica', size: '200-500 dipendenti', website: 'https://techimpianti.it', city: 'Torino' },
  { name: 'AutoService Group', sector: 'Automotive', size: '20-50 dipendenti', website: 'https://autoservice.it', city: 'Bologna' },
  { name: 'GreenEnergy Italia', sector: 'Energia', size: '100-200 dipendenti', website: 'https://greenenergy.it', city: 'Roma' },
  { name: 'PuliziePro Cooperative', sector: 'Servizi', size: '500+ dipendenti', website: 'https://puliziepro.it', city: 'Napoli' },
  { name: 'Artigiani del Legno', sector: 'Artigianato', size: '10-20 dipendenti', website: 'https://artiganilegno.it', city: 'Firenze' },
];

const POST_TEMPLATES = [
  { title: 'Muratore qualificato per cantiere residenziale', desc: 'Cerchiamo muratore esperto per nuovo cantiere residenziale a Milano zona City Life. Il candidato dovrà occuparsi di murature portanti, tramezzature interne e finiture grezze.\n\nIl cantiere durerà circa 18 mesi con possibilità di proroga.', reqs: ['Esperienza minima 3 anni', 'Autonomia nella lettura disegni tecnici', 'Disponibilità lavoro su ponteggi'], bens: ['Retribuzione CCNL edilizia + superminimo', 'Mensa aziendale', 'DPI forniti'], type: 'full_time', contract: 'fixed_term', salaryMin: 1800, salaryMax: 2200, openings: 3, featured: true, urgent: false, specs: ['edilizia'] },
  { title: 'Elettricista industriale – Turni', desc: 'Per importante azienda metalmeccanica cerchiamo elettricista industriale per manutenzione impianti produttivi. Turnazione su 3 turni.\n\nSi richiede disponibilità immediata e flessibilità oraria.', reqs: ['Diploma tecnico o qualifica elettrica', 'Esperienza 2+ anni in ambito industriale', 'Conoscenza PLC base'], bens: ['Contratto CCNL metalmeccanico', 'Buoni pasto €8/giorno', 'Formazione continua'], type: 'full_time', contract: 'permanent', salaryMin: 1600, salaryMax: 1900, openings: 2, featured: false, urgent: true, specs: ['elettrica'] },
  { title: 'Saldatore TIG/MIG – Carpenteria', desc: 'Officina carpenteria metallica cerca saldatore esperto TIG e MIG per produzione strutture in acciaio inox e alluminio.\n\nLavorazione su commessa, ambiente dinamico e professionale.', reqs: ['Patentino saldatura valido', 'Esperienza 3+ anni TIG/MIG', 'Capacità lettura disegno tecnico'], bens: ['Paga competitiva', 'Straordinari retribuiti', 'Ambiente climatizzato'], type: 'full_time', contract: 'permanent', salaryMin: 1700, salaryMax: 2100, openings: 1, featured: true, urgent: false, specs: ['meccanica'] },
  { title: 'Idraulico termoidraulico – Installazioni', desc: 'Azienda leader nel settore HVAC cerca idraulico per installazione e manutenzione impianti di riscaldamento, raffrescamento e sanitari presso clienti residenziali e commerciali.', reqs: ['Qualifica idraulica', 'Patente B', 'Esperienza 2+ anni installazioni'], bens: ['Veicolo aziendale', 'Telefono aziendale', 'Bonus produttività'], type: 'full_time', contract: 'permanent', salaryMin: 1500, salaryMax: 1800, openings: 4, featured: false, urgent: false, specs: ['artigianato'] },
  { title: 'Imbianchino/a – Stagione estiva', desc: 'Per stagione lavorativa intensa cerchiamo imbianchini/e per lavori di tinteggiatura interni ed esterni in ville e condomini zona Firenze.\n\nPeriodo: Aprile-Ottobre.', reqs: ['Esperienza tinteggiatura', 'Autonomia operativa', 'Attrezzatura propria preferibile'], bens: ['Paga oraria €12-15/h', 'Possibilità rinnovo stagionale', 'Lavoro all\'aperto'], type: 'seasonal', contract: 'seasonal', salaryMin: null, salaryMax: null, openings: 6, featured: false, urgent: true, specs: ['edilizia'] },
  { title: 'Meccanico auto – Officina multimarca', desc: 'Officina autorizzata Bosch Car Service cerca meccanico auto per diagnosi, tagliandi e riparazioni meccaniche su veicoli multimarca.\n\nAmbiente moderno e attrezzato.', reqs: ['Qualifica meccatronico', 'Esperienza diagnosi elettronica', 'Patente B'], bens: ['CCNL artigiani', 'Formazione Bosch', 'Sconti ricambi'], type: 'full_time', contract: 'permanent', salaryMin: 1400, salaryMax: 1700, openings: 2, featured: false, urgent: false, specs: ['automotive'] },
  { title: 'Addetto/a pulizie uffici – Part-time mattina', desc: 'Cooperativa di servizi cerca addetti/e pulizie per uffici direzionali zona Napoli centro. Orario 6:00-10:00 dal lunedì al venerdì.', reqs: ['Affidabilità e puntualità', 'Esperienza anche breve', 'Residenza zona Napoli'], bens: ['Contratto part-time regolare', 'TFR e ratei mensili', 'Assicurazione INAIL'], type: 'part_time', contract: 'fixed_term', salaryMin: 500, salaryMax: 650, openings: 8, featured: false, urgent: false, specs: ['pulizia'] },
  { title: 'Falegname artigiano – Mobili su misura', desc: 'Bottega artigiana cerca falegname esperto per produzione mobili su misura in legno massello e impiallacciato. Lavoro di precisione e cura del dettaglio.', reqs: ['Esperienza 5+ anni falegnameria', 'Utilizzo macchine tradizionali e CNC', 'Finiture a regola d\'arte'], bens: ['Ambiente bottega storica', 'Retribuzione commisurata all\'esperienza', 'Creazioni uniche'], type: 'full_time', contract: 'permanent', salaryMin: 1600, salaryMax: 2000, openings: 1, featured: true, urgent: false, specs: ['legno'] },
  { title: 'Operaio generico di magazzino', desc: 'Per hub logistico in espansione cerchiamo operai generici per attività di picking, packing e movimentazione merce. Turni flessibili.', reqs: ['Maggiore età', 'Buona forma fisica', 'Disponibilità turni'], bens: ['Contratto tempo determinato con prospettiva', 'Mensa gratuita', 'Navetta aziendale'], type: 'temporary', contract: 'fixed_term', salaryMin: 1200, salaryMax: 1400, openings: 15, featured: false, urgent: true, specs: ['logistica'] },
  { title: 'Installatore pannelli fotovoltaici', desc: 'Azienda energia rinnovabile cerca installatori per montaggio pannelli fotovoltaici su tetti residenziali e capannoni industriali. Trasferte regionali.', reqs: ['Esperienza coperture/tetti', 'Nozioni elettriche base', 'Patente B + disponibilità trasferte'], bens: ['Retribuzione + diaria trasferta', 'Formazione specifica fotovoltaico', 'Assunzione diretta'], type: 'full_time', contract: 'permanent', salaryMin: 1500, salaryMax: 1900, openings: 5, featured: true, urgent: false, specs: ['elettrica'] },
];

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const config = app.get(ConfigService);
  const specialitiesService = app.get(SpecialitiesService);
  const usersService = app.get(UsersService);
  const matchingService = app.get(MatchingService);

  // Direct model access for bulk seeding
  const userModel = app.get<Model<User>>('UserModel');
  const postModel = app.get<Model<Post>>('PostModel');
  const applicationModel = app.get<Model<Application>>('ApplicationModel');
  const conversationModel = app.get<Model<Conversation>>('ConversationModel');
  const messageModel = app.get<Model<Message>>('MessageModel');
  const fileAssetModel = app.get<Model<FileAsset>>('FileAssetModel');

  console.log('🌱 Seeding database...\n');

  // ── 1. Specialities ──────────────────────────────────────────────
  const specCount = await specialitiesService.seedIfEmpty();
  console.log(`✅ Specialities: ${specCount} records`);

  // Fetch all specialities for reference
  const allSpecs = await specialitiesService.findAllActive();
  const specByName = new Map(allSpecs.map((s) => [s.name, s._id.toString()]));
  const specByCategory = new Map<string, string[]>();
  for (const s of allSpecs) {
    if (!specByCategory.has(s.category)) specByCategory.set(s.category, []);
    specByCategory.get(s.category)!.push(s._id.toString());
  }

  // ── 2. Admin User ───────────────────────────────────────────────
  const adminEmail = config.get<string>('SEED_ADMIN_EMAIL', 'admin@platform.it');
  const adminPassword = config.get<string>('SEED_ADMIN_PASSWORD', 'ChangeMe!2026');
  let adminId: string;

  const existingAdmin = await usersService.findByEmail(adminEmail);
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const admin = await userModel.create({
      email: adminEmail,
      passwordHash,
      fullName: 'Platform Admin',
      specialityIds: [],
      role: 'admin',
      isActive: true,
      onboardingCompleted: true,
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
      lastLoginAt: new Date(),
    });
    adminId = admin._id.toString();
    console.log(`✅ Admin user created: ${adminEmail}`);
  } else {
    adminId = existingAdmin._id.toString();
    console.log(`ℹ️  Admin user already exists: ${adminEmail}`);
  }

  // ── 3. Worker Users ─────────────────────────────────────────────
  const workerIds: string[] = [];
  const workerDocs: UserDocument[] = [];
  const defaultPassword = await bcrypt.hash('Worker123!', 12);

  for (let i = 0; i < WORKER_DATA.length; i++) {
    const w = WORKER_DATA[i];
    const existing = await userModel.findOne({ email: w.email }).exec();
    if (existing) {
      workerIds.push(existing._id.toString());
      workerDocs.push(existing);
      console.log(`ℹ️  Worker already exists: ${w.email}`);
      continue;
    }

    const specIds = w.specs
      .map((cat) => specByCategory.get(cat)?.[0])
      .filter(Boolean) as string[];

    const doc = await userModel.create({
      email: w.email,
      passwordHash: defaultPassword,
      fullName: w.name,
      role: 'worker',
      city: w.city,
      province: w.province,
      bio: w.bio,
      specialityIds: specIds.map((id) => new Types.ObjectId(id)),
      yearsExperience: w.exp,
      certifications: w.certs,
      languages: w.langs,
      availability: w.avail,
      phone: w.phone,
      hasDriversLicence: true,
      isActive: true,
      onboardingCompleted: true,
      avatarUrl: AVATARS[i % AVATARS.length],
      lastLoginAt: new Date(Date.now() - Math.random() * 7 * 86400000),
    });
    workerIds.push(doc._id.toString());
    workerDocs.push(doc);
    console.log(`✅ Worker created: ${w.name} (${w.email})`);
  }

  // ── 4. Create file assets for resumes (simulated) ───────────────
  const resumeFileIds: string[] = [];
  for (let i = 0; i < workerDocs.length; i++) {
    const file = await fileAssetModel.create({
      ownerType: 'user',
      ownerId: workerDocs[i]._id,
      purpose: 'resume',
      storageKey: `seed/resumes/resume-${workerDocs[i].email.replace('@', '-')}.pdf`,
      provider: 'disk',
      url: `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`,
      originalName: `CV_${workerDocs[i].fullName.replace(/\s+/g, '_')}.pdf`,
      mimeType: 'application/pdf',
      extension: 'pdf',
      sizeBytes: 245000 + Math.floor(Math.random() * 500000),
      checksum: `sha256-seed-resume-${i}`,
      isImage: false,
      scanStatus: 'clean',
      visibility: 'employer',
    });
    resumeFileIds.push(file._id.toString());
    // Link to user
    await userModel.findByIdAndUpdate(workerDocs[i]._id, { resumeFileId: file._id });
  }
  console.log(`✅ Created ${resumeFileIds.length} resume file assets`);

  // ── 5. Posts ────────────────────────────────────────────────────
  const postIds: string[] = [];
  const postDocs: PostDocument[] = [];

  for (let i = 0; i < POST_TEMPLATES.length; i++) {
    const t = POST_TEMPLATES[i];
    const company = COMPANIES[i % COMPANIES.length];
    const specIds = t.specs
      .map((cat) => specByCategory.get(cat)?.[0])
      .filter(Boolean) as string[];

    if (specIds.length === 0) {
      console.log(`⚠️  Skipping post "${t.title}" – no matching speciality`);
      continue;
    }

    // Check if already exists by title
    const existing = await postModel.findOne({ title: t.title, deletedAt: null }).exec();
    if (existing) {
      postIds.push(existing._id.toString());
      postDocs.push(existing);
      console.log(`ℹ️  Post already exists: ${t.title}`);
      continue;
    }

    const daysAgo = Math.floor(Math.random() * 25);
    const publishedAt = new Date(Date.now() - daysAgo * 86400000);
    const deadline = new Date(Date.now() + (30 - daysAgo) * 86400000);

    const slug = t.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

    const doc = await postModel.create({
      title: t.title,
      slug,
      summary: t.desc.split('\n')[0].slice(0, 280),
      description: t.desc,
      requirements: t.reqs,
      benefits: t.bens,
      specialityIds: specIds.map((id) => new Types.ObjectId(id)),
      location: {
        city: company.city,
        country: 'IT',
        remote: false,
      },
      employmentType: t.type,
      contractType: t.contract,
      salary: t.salaryMin ? {
        min: t.salaryMin,
        max: t.salaryMax || undefined,
        currency: 'EUR',
        period: 'monthly',
        isNegotiable: !t.salaryMax,
      } : { currency: 'EUR', period: 'monthly', isNegotiable: true },
      company: {
        name: company.name,
        sector: company.sector,
        size: company.size,
        website: company.website,
      },
      status: 'published',
      publishedAt,
      applicationDeadline: deadline,
      openings: t.openings,
      isFeatured: t.featured,
      isUrgent: t.urgent,
      createdBy: new Types.ObjectId(adminId),
      stats: {
        views: 50 + Math.floor(Math.random() * 500),
        likes: 5 + Math.floor(Math.random() * 50),
        applications: 0, // Will update after creating applications
      },
    });
    postIds.push(doc._id.toString());
    postDocs.push(doc);
    console.log(`✅ Post created: ${t.title}`);
  }

  // ── 6. Applications (various statuses) ──────────────────────────
  const appStatuses = ['submitted', 'submitted', 'reviewed', 'accepted', 'rejected', 'withdrawn', 'submitted', 'reviewed'];
  const coverLetters = [
    'Sono molto interessato a questa posizione. Ho maturato esperienza significativa nel settore e credo di poter contribuire positivamente al vostro team.',
    'Ho visto il vostro annuncio e mi candido con entusiasmo. La mia esperienza è in linea con quanto richiesto.',
    'Mi propongo per questa opportunità con forte motivazione. Allego CV aggiornato e referenze.',
    null,
    'Disponibile da subito, automunito e residente in zona. Esperienza verificabile.',
    null,
    'Vorrei sottoporre la mia candidatura. Ho lavorato in contesti simili per diversi anni.',
    'La vostra azienda è un punto di riferimento nel settore. Sarei onorato di entrare a far parte del team.',
  ];

  const applicationDocs: ApplicationDocument[] = [];
  for (let i = 0; i < Math.min(workerIds.length, postIds.length); i++) {
    const workerIdx = i % workerIds.length;
    const postIdx = i % postIds.length;
    const status = appStatuses[i % appStatuses.length];

    // Skip if already applied
    const existing = await applicationModel.findOne({
      userId: new Types.ObjectId(workerIds[workerIdx]),
      postId: new Types.ObjectId(postIds[postIdx]),
    }).exec();
    if (existing) {
      applicationDocs.push(existing);
      console.log(`ℹ️  Application already exists: worker ${workerIdx} → post ${postIdx}`);
      continue;
    }

    const post = postDocs[postIdx];
    const appliedDaysAgo = Math.floor(Math.random() * 20);
    const appliedAt = new Date(Date.now() - appliedDaysAgo * 86400000);

    const statusHistory: any[] = [{
      to: 'submitted',
      actorId: new Types.ObjectId(workerIds[workerIdx]),
      actorRole: 'worker',
      at: appliedAt,
    }];

    let reviewedBy: Types.ObjectId | null = null;
    let reviewedAt: Date | null = null;
    let reviewNotes: string | null = null;

    if (status !== 'submitted') {
      const reviewedDate = new Date(appliedAt.getTime() + 2 * 86400000);
      statusHistory.push({
        from: 'submitted',
        to: 'reviewed',
        actorId: new Types.ObjectId(adminId),
        actorRole: 'admin',
        note: 'Candidatura esaminata',
        at: reviewedDate,
      });
      reviewedBy = new Types.ObjectId(adminId);
      reviewedAt = reviewedDate;
    }

    if (status === 'accepted') {
      const acceptedDate = new Date((reviewedAt as Date).getTime() + 86400000);
      statusHistory.push({
        from: 'reviewed',
        to: 'accepted',
        actorId: new Types.ObjectId(adminId),
        actorRole: 'admin',
        note: 'Ottimo profilo, procediamo con assunzione',
        at: acceptedDate,
      });
      reviewNotes = 'Ottimo profilo, procediamo con assunzione';
    } else if (status === 'rejected') {
      const rejectedDate = new Date((reviewedAt as Date).getTime() + 86400000);
      statusHistory.push({
        from: 'reviewed',
        to: 'rejected',
        actorId: new Types.ObjectId(adminId),
        actorRole: 'admin',
        note: 'Posizione coperta internamente',
        at: rejectedDate,
      });
      reviewNotes = 'Posizione coperta internamente';
    } else if (status === 'withdrawn') {
      const withdrawnDate = new Date(appliedAt.getTime() + 5 * 86400000);
      statusHistory.push({
        from: 'submitted',
        to: 'withdrawn',
        actorId: new Types.ObjectId(workerIds[workerIdx]),
        actorRole: 'worker',
        at: withdrawnDate,
      });
    }

    const appDoc = await applicationModel.create({
      postId: new Types.ObjectId(postIds[postIdx]),
      userId: new Types.ObjectId(workerIds[workerIdx]),
      snapshot: {
        postTitle: post.title,
        postSlug: post.slug,
        companyName: post.company.name,
        city: post.location.city,
        specialityNames: [],
        employmentType: post.employmentType,
      },
      coverLetter: coverLetters[i % coverLetters.length],
      resumeFileId: new Types.ObjectId(resumeFileIds[workerIdx]),
      attachmentFileIds: [],
      status,
      statusHistory,
      reviewedBy,
      reviewedAt,
      reviewNotes,
      contact: {
        phone: WORKER_DATA[workerIdx]?.phone,
        email: WORKER_DATA[workerIdx]?.email,
        availabilityNote: WORKER_DATA[workerIdx]?.avail === 'immediate' ? 'Disponibile da subito' : undefined,
      },
      appliedAt,
      withdrawnAt: status === 'withdrawn' ? new Date(appliedAt.getTime() + 5 * 86400000) : null,
    });
    applicationDocs.push(appDoc);
    console.log(`✅ Application: ${WORKER_DATA[workerIdx]?.name} → "${post.title}" [${status}]`);
  }

  // Update post application counts
  for (const post of postDocs) {
    const count = await applicationModel.countDocuments({ postId: post._id }).exec();
    if (count > 0) {
      await postModel.findByIdAndUpdate(post._id, { 'stats.applications': count });
    }
  }
  console.log('✅ Updated post application counts');

  // ── 7. Conversations & Messages ─────────────────────────────────
  // Create threads for accepted applications
  const acceptedApps = applicationDocs.filter((a) => a.status === 'accepted');
  for (const app of acceptedApps) {
    const existingThread = await conversationModel.findOne({
      participants: { $all: [app.userId, new Types.ObjectId(adminId)] },
      applicationId: app._id,
    }).exec();

    if (existingThread) {
      console.log(`ℹ️  Thread already exists for application ${app._id}`);
      continue;
    }

    const thread = await conversationModel.create({
      participants: [app.userId, new Types.ObjectId(adminId)],
      applicationId: app._id,
      postId: app.postId,
      context: 'application',
      lastMessage: 'Benvenuto! Ti contattiamo presto per i dettagli contrattuali.',
      lastMessageAt: new Date(),
      lastSenderId: new Types.ObjectId(adminId),
      unreadCounts: new Map([[app.userId.toString(), 1]]),
      isClosed: false,
    });

    // Link thread to application
    await applicationModel.findByIdAndUpdate(app._id, { threadId: thread._id });

    // Create messages
    const msgs = [
      { senderId: new Types.ObjectId(adminId), body: `Gentile candidato, la sua candidatura per "${app.snapshot.postTitle}" è stata accettata. La contatteremo a breve per definire i dettagli contrattuali.`, minutesAgo: 120 },
      { senderId: app.userId, body: 'Grazie mille! Sono disponibile per un colloquio conoscitivo questa settimana.', minutesAgo: 90 },
      { senderId: new Types.ObjectId(adminId), body: 'Perfetto. Le invieremo una mail con le date disponibili. A presto!', minutesAgo: 60 },
    ];

    for (const m of msgs) {
      await messageModel.create({
        threadId: thread._id,
        senderId: m.senderId,
        recipientId: m.senderId.equals(new Types.ObjectId(adminId)) ? app.userId : new Types.ObjectId(adminId),
        body: m.body,
        attachments: [],
        readAt: new Date(),
        sentAt: new Date(Date.now() - m.minutesAgo * 60000),
      });
    }
    console.log(`✅ Thread + messages created for accepted application`);
  }

  // Create a direct message thread between two workers (for testing)
  if (workerIds.length >= 2) {
    const existingDirect = await conversationModel.findOne({
      participants: { $all: [new Types.ObjectId(workerIds[0]), new Types.ObjectId(workerIds[1])] },
      context: 'direct',
    }).exec();

    if (!existingDirect) {
      const directThread = await conversationModel.create({
        participants: [new Types.ObjectId(workerIds[0]), new Types.ObjectId(workerIds[1])],
        context: 'direct',
        lastMessage: 'Ciao Marco, hai visto quel cantiere a Monza?',
        lastMessageAt: new Date(Date.now() - 3600000),
        lastSenderId: new Types.ObjectId(workerIds[1]),
        unreadCounts: new Map([[workerIds[0], 1]]),
        isClosed: false,
      });

      await messageModel.create([
        {
          threadId: directThread._id,
          senderId: new Types.ObjectId(workerIds[0]),
          recipientId: new Types.ObjectId(workerIds[1]),
          body: 'Ciao Giulia! Come va il nuovo lavoro?',
          attachments: [],
          readAt: new Date(),
          sentAt: new Date(Date.now() - 7200000),
        },
        {
          threadId: directThread._id,
          senderId: new Types.ObjectId(workerIds[1]),
          recipientId: new Types.ObjectId(workerIds[0]),
          body: 'Benissimo! Ambiente ottimo. Tu che fai di bello?',
          attachments: [],
          readAt: new Date(),
          sentAt: new Date(Date.now() - 5400000),
        },
        {
          threadId: directThread._id,
          senderId: new Types.ObjectId(workerIds[1]),
          recipientId: new Types.ObjectId(workerIds[0]),
          body: 'Ciao Marco, hai visto quel cantiere a Monza?',
          attachments: [],
          readAt: null,
          sentAt: new Date(Date.now() - 3600000),
        },
      ]);
      console.log('✅ Direct message thread created between workers');
    }
  }

  // ── Summary ─────────────────────────────────────────────────────
  const finalStats = await Promise.all([
    userModel.countDocuments({ deletedAt: null }).exec(),
    postModel.countDocuments({ deletedAt: null }).exec(),
    applicationModel.countDocuments().exec(),
    conversationModel.countDocuments().exec(),
    messageModel.countDocuments().exec(),
    fileAssetModel.countDocuments({ deletedAt: null }).exec(),
  ]);

  console.log('\n🎉 Seed complete!');
  console.log(`   👥 Users: ${finalStats[0]}`);
  console.log(`   📋 Posts: ${finalStats[1]}`);
  console.log(`   📨 Applications: ${finalStats[2]}`);
  console.log(`   💬 Conversations: ${finalStats[3]}`);
  console.log(`   ✉️  Messages: ${finalStats[4]}`);
  console.log(`   📁 Files: ${finalStats[5]}`);
  console.log('\n🔑 Test credentials:');
  console.log(`   Admin: ${adminEmail} / ${adminPassword}`);
  for (const w of WORKER_DATA) {
    console.log(`   Worker: ${w.email} / Worker123!`);
  }

  await app.close();
}

bootstrap().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});