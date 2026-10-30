# Worker Placement Platform — UI/UX Blueprint

## 1. Design System & Visual Identity

### 1.1 Color Palette (Industrial Trust)
*Avoids generic tech purple. Grounded in safety, craftsmanship, and professionalism.*

| Token            | Hex       | Usage                                      |
| ---------------- | --------- | ------------------------------------------ |
| `--brand-primary`| `#0F4C81` | Primary actions, headers, active states    |
| `--brand-accent` | `#E67E22` | CTAs, urgent badges, highlights            |
| `--surface-bg`   | `#F8F9FA` | Page background                            |
| `--surface-card` | `#FFFFFF` | Cards, modals, inputs                      |
| `--text-primary` | `#1A1A1A` | Headings, body text                        |
| `--text-muted`   | `#6B7280` | Secondary text, placeholders             |
| `--success`      | `#16A34A` | Accepted status, verified badges           |
| `--warning`      | `#D97706` | Pending review, expiring deadlines         |
| `--danger`       | `#DC2626` | Rejected, errors, destructive actions      |
| `--border`       | `#E5E7EB` | Dividers, input borders                    |

### 1.2 Typography
- **Headings**: `Inter` or `DM Sans` (Bold/SemiBold) — clean, legible at all sizes
- **Body**: `Inter` 400/500 — optimized for long-form reading and forms
- **Mono**: `JetBrains Mono` — for IDs, timestamps, code snippets in admin
- **Scale**: 12px / 14px / 16px / 20px / 24px / 32px / 40px

### 1.3 Spacing & Layout Grid
- **Base unit**: 4px
- **Container max-width**: 1280px (desktop), 100% (mobile)
- **Grid**: 12-column responsive grid with 24px gutters
- **Card padding**: 24px desktop, 16px mobile
- **Section spacing**: 64px vertical between major sections

### 1.4 Component Library Tokens
- **Border radius**: 8px (cards), 6px (inputs/buttons), 999px (badges/pills)
- **Shadows**: `0 1px 3px rgba(0,0,0,0.08)` (subtle), `0 4px 12px rgba(0,0,0,0.12)` (elevated)
- **Transitions**: `150ms ease-in-out` for all interactive states
- **Focus ring**: `2px solid #0F4C81` with `2px offset` for accessibility

---

## 2. Information Architecture & Navigation

### 2.1 Worker Navigation (Bottom Bar Mobile / Sidebar Desktop)
1. **For You** (feed icon) — Personalized matching feed
2. **Browse** (search icon) — All published positions with filters
3. **Applications** (briefcase icon) — My applications + status tracker
4. **Messages** (chat icon) — Conversations with unread badge
5. **Profile** (user icon) — Onboarding, work history, documents, settings

### 2.2 Admin Navigation (Sidebar Only)
1. **Dashboard** — Stats overview
2. **Posts** — CRUD + lifecycle management
3. **Applications** — Review queue + bulk actions
4. **Users** — Worker directory + moderation
5. **Messages** — Moderation + broadcast
6. **Audit Log** — Activity trail
7. **Settings** — Specialities, i18n, rate limits

### 2.3 Global Header Elements
- **Logo** (left) → links to For You / Dashboard
- **Language Toggle** (IT/EN) — persists preference
- **Notifications Bell** — dropdown with unread count + mark-all-read
- **Avatar Menu** — Profile, Export Data (GDPR), Logout

---

## 3. Page-by-Page Specifications

### 3.1 Authentication Pages

#### `/register`
- **Layout**: Centered card (max 480px) on muted background
- **Fields**: Email, Password (with strength meter), Full Name, Age (optional), Phone (optional), City (autocomplete)
- **Specialities Selector**: Multi-select chip group with category grouping (Edilizia, Meccanica, Elettrica, etc.). Max 6. Visual feedback on selection count.
- **Validation**: Real-time inline errors. Password requires uppercase + digit. Email uniqueness check on blur.
- **CTA**: "Crea Account" (primary). Link to login below.
- **Post-submit**: Auto-login → redirect to onboarding if incomplete, else to For You.

#### `/login`
- **Layout**: Same centered card as register
- **Fields**: Email, Password
- **Features**: "Forgot password?" link, "No account? Register" link
- **Rate limit feedback**: After 3 failed attempts, show countdown timer before next attempt
- **Error handling**: Generic "Invalid credentials" message (no email enumeration)

#### `/forgot-password` & `/reset-password`
- Two-step flow: email input → token + new password form
- Token validation on mount; expired tokens show resend link

### 3.2 Worker Onboarding Flow (`/onboarding`)
*Triggered when `onboardingCompleted === false`*

**Step 1: Specialities Confirmation**
- Pre-filled from registration. Can add/remove.
- Category-grouped chips with icons and colors from seed data.
- "Skip for now" option (allows browsing but not applying).

**Step 2: Resume Upload**
- Drag-and-drop zone with file type icons (PDF/DOCX)
- Progress bar during upload. Preview thumbnail after success.
- Validation: max 10MB, PDF/DOCX only. Error state with retry.
- "I'll add later" escape hatch.

**Step 3: Work History (Optional)**
- Timeline-style list of previous positions
- "Add Position" button opens modal/slide-over
- Fields: Title, Company, Dates (start/end or "Current"), Description, Speciality tags
- Validation: endDate > startDate, max 30 entries, exactly one current role
- Attachments: certificate/work sample upload per entry

**Completion**: Confetti animation → redirect to For You feed.

### 3.3 For You Feed (`/for-you`)
*Personalized matching feed — core worker experience*

- **Header**: "Opportunità per te" + last updated timestamp
- **Empty State**: Illustration + "Complete your profile to get better matches" CTA if no specialities selected
- **Card Layout**: Vertical stack (mobile) / 2-column grid (desktop)
- **Job Card Components**:
  - Company logo (48x48) + name + city/province
  - Job title (bold, 2-line clamp)
  - Salary range badge (if available) or "Trattativa riservata"
  - Speciality chips (max 3 visible, "+N" overflow)
  - Match score indicator: colored bar (green/yellow/orange) + percentage label
  - Posted time ago ("2h fa", "3g fa")
  - **Like button**: Heart icon with toggle animation. Optimistic update.
  - **Apply CTA**: Primary button "Candidati" → opens application modal
  - Urgent/Featured badges top-right corner
- **Infinite Scroll**: Cursor-based pagination. Loading skeleton at bottom.
- **Pull-to-refresh** on mobile.

### 3.4 Browse / Search (`/browse`)
- **Filter Bar** (sticky top): Specialities multi-select, City autocomplete, Employment type dropdown, Salary range slider, Remote toggle, Sort (Recent/Salary/Match)
- **Results Count**: "124 opportunità trovate"
- **Same Job Card** as For You but without match score
- **Pagination**: Infinite scroll with "Load more" fallback button
- **URL-synced filters**: Shareable search URLs

### 3.5 Job Detail (`/posts/:id`)
- **Hero Section**: Cover image (if exists), company logo, title, location map snippet
- **Key Info Grid**: Employment type, Contract type, Salary, Schedule, Openings, Deadline
- **Description**: Rich text with proper typography hierarchy
- **Requirements & Benefits**: Bulleted lists in side-by-side columns (desktop)
- **Gallery**: Horizontal scroll carousel of work site photos
- **Attachments**: Downloadable files with size/type indicators
- **Sticky Bottom Bar** (mobile): Like + Apply buttons always visible
- **Related Posts**: "Altre opportunità simili" section at bottom
- **View Counter**: Subtle "👁 234 visualizzazioni" near title

### 3.6 Application Modal / Page (`/apply/:postId`)
- **Pre-filled Snapshot**: Post title, company, city (read-only confirmation)
- **Cover Letter**: Textarea (max 4000 chars) with character counter
- **Resume Selection**: Dropdown of uploaded resumes + "Upload new" option
- **Additional Attachments**: Multi-file upload (certificates, portfolios)
- **Contact Info**: Phone, Email, Availability note (pre-filled from profile, editable)
- **Submit CTA**: "Invia Candidatura" with loading state
- **Post-submit**: Success illustration + "Track in Applications" link
- **Duplicate Prevention**: Disabled if already applied, shows existing application status instead

### 3.7 My Applications (`/applications`)
- **Status Tabs**: All | Submitted | Reviewed | Accepted | Rejected | Withdrawn
- **Application Card**:
  - Post snapshot (title, company, city)
  - Status badge with color coding
  - Timeline: Applied → Reviewed → Decision dates
  - Actions: View details, Withdraw (if submitted), Message employer (if accepted)
  - Review notes preview (if admin provided feedback)
- **Empty States**: Per-tab illustrations encouraging action
- **Export**: CSV download button (admin view only)

### 3.8 Messages (`/messages`)
- **Thread List** (left panel / main view mobile):
  - Avatar + Name + Last message preview (truncated)
  - Timestamp + Unread dot/badge
  - Context tag: "Candidatura", "Diretto", "Admin"
  - Closed threads visually dimmed
- **Conversation View** (right panel / drill-down mobile):
  - Header: Participant name + status + Close/Report actions
  - Message bubbles: Sender-aligned, attachment previews, read receipts (✓✓)
  - Input bar: Text + attachment button + send
  - Rate limit indicator: "30 messaggi/minuto" tooltip when approaching limit
  - Auto-scroll to bottom on new message
  - Mark-as-read on viewport entry
- **New Conversation**: FAB or button → user search/select → context picker

### 3.9 Profile & Settings (`/profile`)
- **Tab Navigation**: Overview | Work History | Documents | Settings
- **Overview Tab**:
  - Avatar upload (crop modal)
  - Editable fields: Name, Bio, City, Province, Availability, Languages, Certifications, Driver's license toggle
  - Specialities display with edit button → reopens selector
  - Profile completeness progress bar
- **Work History Tab**:
  - Draggable reorder list
  - Add/Edit/Delete entries via slide-over
  - Current role highlighted with green accent
  - Attachment thumbnails per entry
- **Documents Tab**:
  - Grid of uploaded files grouped by purpose (Resume, Certificates, Samples)
  - Upload button per category
  - File metadata: name, size, upload date, scan status badge
  - Delete with confirmation modal
- **Settings Tab**:
  - Change password form
  - Language preference
  - Notification preferences (toggles)
  - GDPR: "Export My Data" button + "Delete Account" danger zone with double confirmation

### 3.10 Notifications Panel
- **Dropdown** from header bell icon
- **Grouped by date**: Today / Yesterday / Earlier
- **Types with icons**: Application status change, New message, Matching post, Admin broadcast
- **Click behavior**: Navigate to relevant page + auto-mark read
- **Mark All Read** button at top
- **Empty state**: "Nessuna notifica" illustration

### 3.11 Admin Dashboard (`/admin/dashboard`)
- **Stats Cards Row**: Total Users, Active Workers, Published Posts, Applications (Last 30d), Acceptance Rate %
- **Charts Section**:
  - Application funnel (Submitted → Reviewed → Accepted/Rejected)
  - Signups trend (30-day line chart)
  - Top specialities by demand (horizontal bar chart)
- **Top Posts Table**: Title, Company, Views, Likes, Applications, Status
- **Quick Actions**: Create Post, Broadcast Notification, View Audit Log

### 3.12 Admin Posts Management (`/admin/posts`)
- **Data Table**: Title, Status badge, Specialities, City, Published Date, Stats, Actions
- **Filters**: Status, Speciality, City, Date range
- **Actions Column**: Edit, Publish/Close/Archive (lifecycle buttons), Delete
- **Create/Edit Form**: Full WYSIWYG editor for description, media gallery uploader, salary fields, deadline picker, featured/urgent toggles
- **Validation**: Required fields highlighted before publish allowed

### 3.13 Admin Applications Review (`/admin/applications`)
- **Queue View**: Filterable by status, post, date range
- **Application Detail Slide-over**:
  - Worker profile summary + resume preview/download
  - Cover letter + attachments
  - Status history timeline
  - Action buttons: Accept / Reject / Mark Reviewed + Notes textarea
  - "Message Worker" button (auto-creates thread on accept)
- **Bulk Actions**: Select multiple → Accept/Reject batch with shared note

### 3.14 Admin Users Management (`/admin/users`)
- **Searchable Table**: Name, Email, Role, Specialities, City, Status, Last Login
- **User Detail Drawer**: Full profile view, application history, message history, audit trail
- **Actions**: Activate/Deactivate, Edit role/specialities, Soft-delete, Impersonate (dev only)

### 3.15 Admin Audit Log (`/admin/audit`)
- **Filterable Table**: Timestamp, Actor, Action, Entity, Entity ID, IP
- **Expandable Rows**: Before/After JSON diff viewer
- **Date Range Picker** + Export CSV

---

## 4. Interaction Patterns & Micro-interactions

### 4.1 Loading States
- **Skeleton screens** for feeds and lists (not spinners)
- **Button loading**: Spinner replaces text, disabled state
- **Optimistic updates**: Like toggle, message send appear instantly, revert on error
- **Progressive image loading**: BlurHash placeholder → full resolution

### 4.2 Error Handling
- **Inline validation**: Red border + message below field, focus management
- **Toast notifications**: Top-right for transient errors (network, rate limit)
- **Full-page error**: Illustration + message + retry/back buttons for 404/500
- **Rate limit feedback**: Countdown timer + explanatory text, not generic 429

### 4.3 Empty States
- Every list view has a unique illustrated empty state
- Clear CTA guiding user to next action
- Friendly copy in Italian (primary) with English fallback

### 4.4 Accessibility (WCAG 2.1 AA)
- Keyboard navigation throughout
- Screen reader labels on all icons and interactive elements
- Color contrast ≥ 4.5:1 for text, ≥ 3:1 for UI components
- Reduced motion preference respected
- Focus visible on all interactive elements
- Form labels always associated with inputs

### 4.5 Responsive Breakpoints
- **Mobile**: < 640px — Single column, bottom nav, full-width cards
- **Tablet**: 640–1024px — 2-column grids, collapsible sidebar
- **Desktop**: > 1024px — Multi-column layouts, persistent sidebar, hover states

---

## 5. File Data UX Considerations

### 5.1 Upload Experience
- **Drag-and-drop zones** with dashed border + icon + instructional text
- **File type validation** before upload starts (client-side MIME check)
- **Progress indicators** for each file with cancel option
- **Thumbnail generation** for images immediately after upload
- **Scan status badges**: Pending (yellow) → Clean (green) / Infected (red) / Failed (gray)

### 5.2 Document Preview
- **PDF**: Embedded viewer with download option
- **Images**: Lightbox gallery with zoom
- **DOCX**: Converted preview or download-only with clear labeling
- **Accessibility**: Alt text for images, downloadable originals for screen readers

### 5.3 Privacy & Visibility Indicators
- **Lock icon** on private files with tooltip explaining visibility
- **Public badge** on avatar/post images
- **Clear deletion warnings**: "This file will be permanently removed after 30 days"
- **GDPR export** includes all file metadata and download links

---

## 6. i18n Strategy

### 6.1 Language Support
- **Primary**: Italian (`it`)
- **Secondary**: English (`en`)
- **Detection**: Browser preference → stored preference → URL parameter override
- **Persistence**: localStorage + user profile setting

### 6.2 Translation Scope
- All UI labels, buttons, placeholders, error messages
- Email templates (future)
- Notification content
- Admin interface (English-first acceptable, Italian preferred)
- Date/time formatting (DD/MM/YYYY for IT, MM/DD/YYYY for EN)
- Currency formatting (€ 1.234,56 vs $1,234.56)

### 6.3 Content Localization
- Job descriptions remain in original language (employer choice)
- Speciality names translated via seed data mapping
- Legal/GDPR text professionally translated, not machine-translated

---

## 7. Performance Targets

| Metric               | Target     | Measurement              |
| -------------------- | ---------- | ------------------------ |
| LCP                  | < 2.5s     | For You feed load        |
| FID                  | < 100ms    | First interaction        |
| CLS                  | < 0.1      | Layout stability         |
| Feed scroll FPS      | ≥ 55       | Infinite scroll          |
| Image load           | < 1s       | Above-fold images        |
| API response         | < 300ms    | p95 for feed endpoint    |
| Bundle size          | < 200KB    | Initial JS (gzipped)     |

---

## 8. Implementation Priority

### Phase 1 (MVP Launch)
1. Auth pages (Register/Login/Forgot Password)
2. Onboarding flow
3. For You feed + Job detail + Apply
4. My Applications
5. Profile (Overview + Documents)
6. Basic messaging

### Phase 2 (Engagement)
1. Browse/Search with filters
2. Work History management
3. Notifications system
4. Profile completeness gamification
5. Mobile bottom navigation

### Phase 3 (Admin & Scale)
1. Admin dashboard + posts CRUD
2. Application review workflow
3. User management
4. Audit log viewer
5. Broadcast notifications

### Phase 4 (Polish)
1. Advanced animations/micro-interactions
2. Dark mode
3. PWA/offline support
4. Accessibility audit remediation
5. Performance optimization pass