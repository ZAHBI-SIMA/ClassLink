# Plan de Développement — ClasseLink
**Plateforme SaaS de Gestion Scolaire Numérique**  
Version 2.0 — Mai 2026  
Stack : Next.js 14+ · PostgreSQL · Prisma · Vercel

---

## Table des Matières

1. [Structure du Projet](#1-structure-du-projet)
2. [Étape 0 — Initialisation & Configuration](#étape-0--initialisation--configuration)
3. [Étape 1 — Base de Données & Architecture Multitenant](#étape-1--base-de-données--architecture-multitenant)
4. [Étape 2 — Authentification & RBAC](#étape-2--authentification--rbac)
5. [Phase 1 — MVP (Mois 1-3)](#phase-1--mvp-mois-1-3)
   - [Étape 3 — Dashboard Super Administrateur](#étape-3--dashboard-super-administrateur)
   - [Étape 4 — Dashboard Administrateur École](#étape-4--dashboard-administrateur-école)
   - [Étape 5 — Module Notes & Moyennes](#étape-5--module-notes--moyennes)
   - [Étape 6 — Module Présences](#étape-6--module-présences)
   - [Étape 7 — Génération de Bulletins PDF](#étape-7--génération-de-bulletins-pdf)
   - [Étape 8 — Dashboards Enseignant & Parent (MVP)](#étape-8--dashboards-enseignant--parent-mvp)
   - [Étape 9 — Paiements Mobile Money](#étape-9--paiements-mobile-money)
   - [Étape 10 — Notifications Email & PWA de base](#étape-10--notifications-email--pwa-de-base)
6. [Phase 2 — Complet (Mois 4-6)](#phase-2--complet-mois-4-6)
   - [Étape 11 — Module Devoirs & Rendu en Ligne](#étape-11--module-devoirs--rendu-en-ligne)
   - [Étape 12 — Cahier de Texte Numérique](#étape-12--cahier-de-texte-numérique)
   - [Étape 13 — Module Financier Avancé](#étape-13--module-financier-avancé)
   - [Étape 14 — Messagerie Interne](#étape-14--messagerie-interne)
   - [Étape 15 — Dashboard Super Admin Complet](#étape-15--dashboard-super-admin-complet)
   - [Étape 16 — Analytics & Reporting Avancé](#étape-16--analytics--reporting-avancé)
   - [Étape 17 — SMS & Inscriptions en Ligne](#étape-17--sms--inscriptions-en-ligne)
   - [Étape 18 — Conseil de Classe Numérique](#étape-18--conseil-de-classe-numérique)
7. [Phase 3 — Avancé (Mois 7-12)](#phase-3--avancé-mois-7-12)
8. [Stratégie de Tests](#stratégie-de-tests)
9. [Déploiement & CI/CD](#déploiement--cicd)
10. [Conventions de Code](#conventions-de-code)

---

## 1. Structure du Projet

```
classelink/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Groupe de routes authentification
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── verify/
│   ├── (dashboard)/              # Groupe principal (authentifié)
│   │   ├── super-admin/          # Dashboard Super Administrateur
│   │   ├── admin/                # Dashboard Administrateur École
│   │   ├── teacher/              # Dashboard Enseignant
│   │   ├── parent/               # Dashboard Parent
│   │   └── student/              # Dashboard Élève
│   ├── (public)/                 # Pages publiques (inscription en ligne)
│   │   └── [school]/enroll/
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   ├── webhooks/
│   │   └── v1/                   # API publique REST
│   └── layout.tsx
├── components/                   # Composants réutilisables
│   ├── ui/                       # shadcn/ui + composants custom
│   ├── forms/
│   ├── tables/
│   ├── charts/
│   └── pdf/                      # Composants génération PDF
├── lib/                          # Utilitaires & logique métier
│   ├── auth/                     # Config Auth.js
│   ├── db/                       # Client Prisma + helpers tenant
│   ├── payments/                 # Intégrations paiement
│   ├── notifications/            # Email, SMS, Push
│   ├── storage/                  # Cloudflare R2
│   └── validations/              # Schémas Zod
├── actions/                      # Server Actions par domaine
│   ├── auth.ts
│   ├── schools.ts
│   ├── students.ts
│   ├── grades.ts
│   ├── attendance.ts
│   ├── payments.ts
│   └── ...
├── hooks/                        # Custom React hooks
├── stores/                       # Zustand stores
├── types/                        # Types TypeScript globaux
├── prisma/
│   ├── schema.prisma             # Schéma public (tenants, plans)
│   ├── tenant-schema.prisma      # Schéma par tenant (élèves, notes...)
│   └── migrations/
├── public/
│   ├── manifest.json             # PWA manifest
│   └── sw.js                     # Service Worker
├── emails/                       # Templates React Email
├── messages/                     # Fichiers i18n (fr, en)
├── middleware.ts                 # Résolution tenant + auth
└── next.config.ts
```

---

## Étape 0 — Initialisation & Configuration

### 0.1 Création du Projet

```bash
npx create-next-app@latest classelink \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*"
```

### 0.2 Dépendances à Installer

**Core :**
```bash
npm install prisma @prisma/client
npm install next-auth@beta
npm install @tanstack/react-query zustand
npm install react-hook-form @hookform/resolvers zod
npm install next-intl
npm install next-pwa
```

**UI :**
```bash
npx shadcn@latest init
# Composants shadcn à ajouter au fur et à mesure :
# button, input, form, table, dialog, sheet, tabs,
# card, badge, select, calendar, dropdown-menu,
# toast, alert, progress, avatar, skeleton
npm install @radix-ui/react-icons lucide-react
npm install recharts                    # Graphiques
npm install @dnd-kit/core @dnd-kit/sortable  # Drag & drop emploi du temps
```

**Backend / Infra :**
```bash
npm install @upstash/redis @upstash/ratelimit
npm install bullmq ioredis
npm install resend @react-email/components
npm install @aws-sdk/client-s3         # Compatible Cloudflare R2
npm install @sentry/nextjs
npm install bcryptjs
npm install @types/bcryptjs -D
```

**PDF & Exports :**
```bash
npm install @react-pdf/renderer        # Bulletins PDF
npm install xlsx                        # Export Excel
npm install papaparse                   # Import/Export CSV
```

**Utilitaires :**
```bash
npm install date-fns                    # Manipulation dates
npm install slugify nanoid              # IDs et slugs
npm install sharp                       # Optimisation images
```

### 0.3 Configuration des Variables d'Environnement

Fichier `.env.local` :
```env
# Base de données
DATABASE_URL="postgresql://..."
DATABASE_PUBLIC_URL="postgresql://..."    # Neon pooled connection

# Auth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."
AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."

# Email — Resend
RESEND_API_KEY="..."
EMAIL_FROM="noreply@classelink.ci"

# SMS — AfricasTalking
AT_API_KEY="..."
AT_USERNAME="..."
AT_SHORTCODE="..."

# Stockage — Cloudflare R2
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="classelink"
R2_PUBLIC_URL="https://..."

# Redis — Upstash
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."

# Paiements — CinetPay
CINETPAY_API_KEY="..."
CINETPAY_SITE_ID="..."

# Monitoring — Sentry
SENTRY_DSN="..."
SENTRY_ORG="..."
SENTRY_PROJECT="..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="ClasseLink"
```

### 0.4 Configuration ESLint, Prettier, Husky

```bash
npm install -D prettier eslint-config-prettier
npm install -D husky lint-staged
npm install -D @commitlint/cli @commitlint/config-conventional
npx husky init
```

`.prettierrc` :
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

---

## Étape 1 — Base de Données & Architecture Multitenant

### 1.1 Schéma Public (Partagé entre tous les tenants)

```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ─── Plans tarifaires ────────────────────────────────
model Plan {
  id          String   @id @default(cuid())
  name        String   // "Gratuit", "Starter", "Pro", "Entreprise"
  slug        String   @unique
  priceMonthly Int     // en FCFA
  priceYearly  Int
  maxStudents  Int      // -1 = illimité
  maxStorage   Int      // en MB
  features     Json     // liste des fonctionnalités activées
  isActive     Boolean  @default(true)
  schools      School[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

// ─── Écoles (Tenants) ────────────────────────────────
model School {
  id          String        @id @default(cuid())
  name        String
  slug        String        @unique  // utilisé comme schéma PostgreSQL : school_{slug}
  subdomain   String?       @unique  // lycee-moderne.classelink.ci
  customDomain String?      @unique  // gestion.lycee-moderne.ci
  logoUrl     String?
  address     String?
  city        String?
  country     String        @default("CI")
  phone       String?
  email       String?
  status      SchoolStatus  @default(TRIAL)
  planId      String
  plan        Plan          @relation(fields: [planId], references: [id])
  trialEndsAt DateTime?
  subscription Subscription?
  superAdminNotes String?
  schemaName  String        @unique  // "school_abc123"
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

enum SchoolStatus {
  TRIAL
  ACTIVE
  SUSPENDED
  CANCELLED
}

// ─── Abonnements ─────────────────────────────────────
model Subscription {
  id              String             @id @default(cuid())
  schoolId        String             @unique
  school          School             @relation(fields: [schoolId], references: [id])
  planId          String
  billing         BillingCycle       @default(MONTHLY)
  status          SubscriptionStatus @default(ACTIVE)
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  cancelAtPeriodEnd  Boolean         @default(false)
  promoCode       String?
  discountPercent Int?
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
  payments        GlobalPayment[]
}

enum BillingCycle { MONTHLY YEARLY }
enum SubscriptionStatus { ACTIVE PAST_DUE CANCELLED TRIALING }

// ─── Paiements globaux (abonnements SaaS) ────────────
model GlobalPayment {
  id             String        @id @default(cuid())
  subscriptionId String
  subscription   Subscription  @relation(fields: [subscriptionId], references: [id])
  amount         Int           // en FCFA
  currency       String        @default("XOF")
  status         PaymentStatus @default(PENDING)
  provider       String        // "cinetpay", "orange_money", etc.
  providerRef    String?
  createdAt      DateTime      @default(now())
}

enum PaymentStatus { PENDING SUCCESS FAILED REFUNDED }

// ─── Audit log global ────────────────────────────────
model GlobalAuditLog {
  id         String   @id @default(cuid())
  schoolId   String?
  userId     String?
  action     String
  resource   String
  resourceId String?
  metadata   Json?
  ip         String?
  userAgent  String?
  createdAt  DateTime @default(now())

  @@index([schoolId])
  @@index([createdAt])
}
```

### 1.2 Schéma Tenant (Un par école — schéma dynamique)

```prisma
// Ce schéma est appliqué dans chaque schéma PostgreSQL school_xxx

// ─── Utilisateurs ────────────────────────────────────
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String?
  firstName     String
  lastName      String
  phone         String?
  avatarUrl     String?
  role          Role
  isActive      Boolean   @default(true)
  emailVerified Boolean   @default(false)
  twoFactorEnabled Boolean @default(false)
  twoFactorSecret  String?
  lastLoginAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations selon le rôle
  teacherProfile   Teacher?
  studentProfile   Student?
  parentProfile    Parent?
  sessions         Session[]
  notifications    Notification[]
  sentMessages     Message[]     @relation("SentMessages")
  receivedMessages Message[]     @relation("ReceivedMessages")
  auditLogs        AuditLog[]
}

enum Role {
  ADMIN        // Directeur
  CENSOR       // Censeur / Surveillant général
  ACCOUNTANT   // Comptable
  TEACHER      // Enseignant
  PARENT       // Parent / Tuteur
  STUDENT      // Élève
}

// ─── Sessions Auth ────────────────────────────────────
model Session {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  expiresAt DateTime
  ip        String?
  userAgent String?
  createdAt DateTime @default(now())
}

// ─── Années scolaires ────────────────────────────────
model AcademicYear {
  id          String    @id @default(cuid())
  name        String    // "2025-2026"
  startDate   DateTime
  endDate     DateTime
  isCurrent   Boolean   @default(false)
  terms       Term[]
  classes     Class[]
  enrollments Enrollment[]
  createdAt   DateTime  @default(now())
}

// ─── Trimestres ──────────────────────────────────────
model Term {
  id             String       @id @default(cuid())
  academicYearId String
  academicYear   AcademicYear @relation(fields: [academicYearId], references: [id])
  name           String       // "1er Trimestre"
  order          Int          // 1, 2, 3
  startDate      DateTime
  endDate        DateTime
  reportCardDate DateTime?
  grades         Grade[]
  attendances    Attendance[]
}

// ─── Niveaux ─────────────────────────────────────────
model Level {
  id      String   @id @default(cuid())
  name    String   // "6ème", "5ème", ..., "Terminale"
  order   Int
  classes Class[]
  subjects LevelSubject[]
}

// ─── Filières / Séries ───────────────────────────────
model Stream {
  id      String   @id @default(cuid())
  name    String   // "A", "C", "D", "TI"
  classes Class[]
}

// ─── Matières ────────────────────────────────────────
model Subject {
  id       String         @id @default(cuid())
  name     String
  code     String
  levels   LevelSubject[]
  teachers TeacherSubjectClass[]
  grades   Grade[]
  lessons  Lesson[]
}

model LevelSubject {
  id          String  @id @default(cuid())
  levelId     String
  level       Level   @relation(fields: [levelId], references: [id])
  subjectId   String
  subject     Subject @relation(fields: [subjectId], references: [id])
  coefficient Float   @default(1)

  @@unique([levelId, subjectId])
}

// ─── Classes ─────────────────────────────────────────
model Class {
  id             String       @id @default(cuid())
  name           String       // "6ème A"
  levelId        String
  level          Level        @relation(fields: [levelId], references: [id])
  streamId       String?
  stream         Stream?      @relation(fields: [streamId], references: [id])
  academicYearId String
  academicYear   AcademicYear @relation(fields: [academicYearId], references: [id])
  maxStudents    Int          @default(40)
  room           String?
  headTeacherId  String?
  headTeacher    Teacher?     @relation("HeadTeacher", fields: [headTeacherId], references: [id])
  enrollments    Enrollment[]
  schedules      Schedule[]
  assignments    Assignment[]
  announcements  Announcement[]
  teachers       TeacherSubjectClass[]
}

// ─── Enseignants ─────────────────────────────────────
model Teacher {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id])
  employeeId  String?  @unique
  specialty   String?
  hireDate    DateTime?
  classes     TeacherSubjectClass[]
  headOfClass Class[]  @relation("HeadTeacher")
  availability TeacherAvailability[]
  appointments Appointment[]
}

model TeacherSubjectClass {
  id        String  @id @default(cuid())
  teacherId String
  teacher   Teacher @relation(fields: [teacherId], references: [id])
  subjectId String
  subject   Subject @relation(fields: [subjectId], references: [id])
  classId   String
  class     Class   @relation(fields: [classId], references: [id])

  @@unique([teacherId, subjectId, classId])
}

// ─── Élèves ──────────────────────────────────────────
model Student {
  id             String       @id @default(cuid())
  userId         String       @unique
  user           User         @relation(fields: [userId], references: [id])
  studentId      String       @unique  // Matricule
  dateOfBirth    DateTime?
  gender         String?
  address        String?
  enrollments    Enrollment[]
  parents        ParentStudent[]
  grades         Grade[]
  attendances    Attendance[]
  submissions    Submission[]
  payments       Payment[]
}

// ─── Parents ─────────────────────────────────────────
model Parent {
  id       String          @id @default(cuid())
  userId   String          @unique
  user     User            @relation(fields: [userId], references: [id])
  children ParentStudent[]
  payments Payment[]
}

model ParentStudent {
  id        String  @id @default(cuid())
  parentId  String
  parent    Parent  @relation(fields: [parentId], references: [id])
  studentId String
  student   Student @relation(fields: [studentId], references: [id])
  relation  String  // "Père", "Mère", "Tuteur"
  isPrimary Boolean @default(false)

  @@unique([parentId, studentId])
}

// ─── Inscriptions ────────────────────────────────────
model Enrollment {
  id             String       @id @default(cuid())
  studentId      String
  student        Student      @relation(fields: [studentId], references: [id])
  classId        String
  class          Class        @relation(fields: [classId], references: [id])
  academicYearId String
  academicYear   AcademicYear @relation(fields: [academicYearId], references: [id])
  enrolledAt     DateTime     @default(now())
  status         EnrollmentStatus @default(ACTIVE)

  @@unique([studentId, academicYearId])
}

enum EnrollmentStatus { ACTIVE TRANSFERRED EXPELLED GRADUATED }

// ─── Notes ───────────────────────────────────────────
model Grade {
  id          String       @id @default(cuid())
  studentId   String
  student     Student      @relation(fields: [studentId], references: [id])
  subjectId   String
  subject     Subject      @relation(fields: [subjectId], references: [id])
  termId      String
  term        Term         @relation(fields: [termId], references: [id])
  type        EvaluationType
  value       Float
  maxValue    Float        @default(20)
  coefficient Float        @default(1)
  comment     String?
  publishedAt DateTime?
  createdBy   String       // userId de l'enseignant
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

enum EvaluationType {
  DEVOIR        // Devoir noté
  INTERROGATION // Interrogation
  COMPOSITION   // Composition
  EXAM          // Examen
}

// ─── Présences ────────────────────────────────────────
model Attendance {
  id          String           @id @default(cuid())
  studentId   String
  student     Student          @relation(fields: [studentId], references: [id])
  termId      String
  term        Term             @relation(fields: [termId], references: [id])
  date        DateTime
  scheduleId  String?
  schedule    Schedule?        @relation(fields: [scheduleId], references: [id])
  status      AttendanceStatus
  justified   Boolean          @default(false)
  justification String?
  recordedBy  String           // userId
  createdAt   DateTime         @default(now())

  @@unique([studentId, date, scheduleId])
}

enum AttendanceStatus { PRESENT ABSENT LATE EXCUSED }

// ─── Emploi du Temps ──────────────────────────────────
model Schedule {
  id        String   @id @default(cuid())
  classId   String
  class     Class    @relation(fields: [classId], references: [id])
  teacherSubjectClassId String
  dayOfWeek Int      // 1=Lundi, 5=Vendredi
  startTime String   // "08:00"
  endTime   String   // "10:00"
  room      String?
  attendances Attendance[]
  lessons   Lesson[]
}

// ─── Cahier de Texte ──────────────────────────────────
model Lesson {
  id          String   @id @default(cuid())
  scheduleId  String
  schedule    Schedule @relation(fields: [scheduleId], references: [id])
  subjectId   String
  subject     Subject  @relation(fields: [subjectId], references: [id])
  date        DateTime
  title       String
  content     String   // Rich text (JSON ou Markdown)
  nextContent String?
  homework    String?
  resources   Json?    // [{name, url, type}]
  teacherId   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ─── Devoirs ──────────────────────────────────────────
model Assignment {
  id          String       @id @default(cuid())
  classId     String
  class       Class        @relation(fields: [classId], references: [id])
  teacherId   String
  subjectId   String
  title       String
  description String?
  attachments Json?        // [{name, url, type}]
  dueDate     DateTime
  maxScore    Float?
  submissions Submission[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model Submission {
  id           String     @id @default(cuid())
  assignmentId String
  assignment   Assignment @relation(fields: [assignmentId], references: [id])
  studentId    String
  student      Student    @relation(fields: [studentId], references: [id])
  files        Json?      // [{name, url, type}]
  submittedAt  DateTime   @default(now())
  score        Float?
  feedback     String?
  gradedAt     DateTime?
  status       SubmissionStatus @default(SUBMITTED)
}

enum SubmissionStatus { SUBMITTED GRADED LATE }

// ─── Frais Scolaires ─────────────────────────────────
model FeeType {
  id          String    @id @default(cuid())
  name        String    // "Frais d'inscription", "Scolarité", "Cantine"
  amount      Int       // en FCFA
  isOptional  Boolean   @default(false)
  payments    Payment[]
}

model Payment {
  id          String        @id @default(cuid())
  studentId   String
  student     Student       @relation(fields: [studentId], references: [id])
  parentId    String?
  parent      Parent?       @relation(fields: [parentId], references: [id])
  feeTypeId   String
  feeType     FeeType       @relation(fields: [feeTypeId], references: [id])
  amount      Int
  status      PaymentStatus @default(PENDING)
  provider    String?       // "orange_money", "mtn_momo", "wave"
  providerRef String?
  receipt     String?       // URL du reçu PDF
  paidAt      DateTime?
  dueDate     DateTime?
  createdAt   DateTime      @default(now())
}

// ─── Messagerie ───────────────────────────────────────
model Message {
  id          String    @id @default(cuid())
  senderId    String
  sender      User      @relation("SentMessages", fields: [senderId], references: [id])
  recipientId String
  recipient   User      @relation("ReceivedMessages", fields: [recipientId], references: [id])
  subject     String?
  body        String
  attachments Json?
  readAt      DateTime?
  studentId   String?   // contexte : l'élève concerné
  createdAt   DateTime  @default(now())
}

// ─── Annonces ─────────────────────────────────────────
model Announcement {
  id          String    @id @default(cuid())
  title       String
  content     String    // Rich text
  authorId    String
  targetRoles Json      // ["PARENT", "STUDENT"] ou null = tout le monde
  classId     String?
  class       Class?    @relation(fields: [classId], references: [id])
  isPinned    Boolean   @default(false)
  expiresAt   DateTime?
  createdAt   DateTime  @default(now())
}

// ─── Notifications ────────────────────────────────────
model Notification {
  id        String           @id @default(cuid())
  userId    String
  user      User             @relation(fields: [userId], references: [id])
  type      NotificationType
  title     String
  body      String
  data      Json?
  readAt    DateTime?
  createdAt DateTime         @default(now())
}

enum NotificationType {
  GRADE_PUBLISHED
  ABSENCE_RECORDED
  ASSIGNMENT_CREATED
  ASSIGNMENT_DUE
  REPORT_CARD_AVAILABLE
  PAYMENT_RECEIVED
  PAYMENT_DUE
  NEW_MESSAGE
  ANNOUNCEMENT
  APPOINTMENT_CONFIRMED
}

// ─── Rendez-vous ──────────────────────────────────────
model Appointment {
  id          String            @id @default(cuid())
  teacherId   String
  teacher     Teacher           @relation(fields: [teacherId], references: [id])
  parentId    String
  studentId   String?
  scheduledAt DateTime
  duration    Int               @default(30) // minutes
  status      AppointmentStatus @default(PENDING)
  notes       String?
  createdAt   DateTime          @default(now())
}

enum AppointmentStatus { PENDING CONFIRMED CANCELLED COMPLETED }

// ─── Audit Log Tenant ─────────────────────────────────
model AuditLog {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  action     String
  resource   String
  resourceId String?
  oldValue   Json?
  newValue   Json?
  ip         String?
  createdAt  DateTime @default(now())

  @@index([userId])
  @@index([createdAt])
}
```

### 1.3 Helper Prisma Multitenant

```typescript
// lib/db/tenant.ts
import { PrismaClient } from '@prisma/client'

const tenantClients = new Map<string, PrismaClient>()

export function getTenantPrisma(schemaName: string): PrismaClient {
  if (tenantClients.has(schemaName)) {
    return tenantClients.get(schemaName)!
  }

  const client = new PrismaClient({
    datasources: {
      db: {
        url: `${process.env.DATABASE_URL}?schema=${schemaName}`,
      },
    },
  })

  tenantClients.set(schemaName, client)
  return client
}

export async function getSchemaFromDomain(hostname: string): Promise<string | null> {
  // Extraire le subdomain ou chercher le domaine custom
  const subdomain = hostname.split('.')[0]
  // Chercher dans la table publique School
  const school = await publicPrisma.school.findFirst({
    where: {
      OR: [
        { subdomain },
        { customDomain: hostname },
      ],
      status: { in: ['TRIAL', 'ACTIVE'] },
    },
  })
  return school?.schemaName ?? null
}
```

### 1.4 Middleware de Résolution du Tenant

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const schemaName = await getSchemaFromDomain(hostname)

  if (!schemaName && !isRootDomain(hostname)) {
    return NextResponse.redirect(new URL('/not-found', request.url))
  }

  // Injecter le schéma dans les headers pour les Server Components
  const response = NextResponse.next()
  if (schemaName) {
    response.headers.set('x-tenant-schema', schemaName)
  }

  return response
}
```

### 1.5 Mise en Place du Schéma Tenant lors de la Création d'une École

```typescript
// actions/schools.ts (Server Action)
export async function createSchool(data: CreateSchoolInput) {
  const schemaName = `school_${nanoid(8).toLowerCase()}`

  // 1. Créer l'entrée dans le schéma public
  await publicPrisma.school.create({
    data: { ...data, schemaName },
  })

  // 2. Créer le schéma PostgreSQL
  await publicPrisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`)

  // 3. Appliquer les migrations sur ce schéma (via Prisma)
  const tenantPrisma = getTenantPrisma(schemaName)
  // Les migrations sont appliquées via un script dédié
  await runTenantMigrations(schemaName)

  // 4. Créer l'utilisateur admin de l'école
  await createDefaultAdmin(schemaName, data.adminEmail)
}
```

---

## Étape 2 — Authentification & RBAC

### 2.1 Configuration Auth.js (Next-Auth v5)

```typescript
// lib/auth/config.ts
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { compare } from 'bcryptjs'
import { loginSchema } from '@/lib/validations/auth'

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        const { email, password, schemaName } = loginSchema.parse(credentials)
        const db = getTenantPrisma(schemaName)
        const user = await db.user.findUnique({ where: { email } })
        if (!user?.passwordHash) return null
        const valid = await compare(password, user.passwordHash)
        if (!valid) return null
        return { id: user.id, email: user.email, role: user.role, schemaName }
      },
    }),
    Google,
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.schemaName = user.schemaName
      }
      return token
    },
    async session({ session, token }) {
      session.user.role = token.role
      session.user.schemaName = token.schemaName
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: { strategy: 'jwt' },
})
```

### 2.2 Middleware RBAC

```typescript
// lib/auth/rbac.ts
export const PERMISSIONS = {
  GRADE: {
    READ:   ['ADMIN', 'CENSOR', 'TEACHER', 'PARENT', 'STUDENT'],
    CREATE: ['ADMIN', 'TEACHER'],
    UPDATE: ['ADMIN', 'TEACHER'],
    DELETE: ['ADMIN'],
  },
  PAYMENT: {
    READ:   ['ADMIN', 'ACCOUNTANT', 'PARENT'],
    CREATE: ['ADMIN', 'ACCOUNTANT', 'PARENT'],
    UPDATE: ['ADMIN', 'ACCOUNTANT'],
    DELETE: ['ADMIN'],
  },
  ANNOUNCEMENT: {
    READ:   ['ADMIN', 'CENSOR', 'TEACHER', 'PARENT', 'STUDENT'],
    CREATE: ['ADMIN', 'CENSOR', 'TEACHER'],
    UPDATE: ['ADMIN', 'CENSOR'],
    DELETE: ['ADMIN'],
  },
  // ... autres ressources
} as const

export function can(role: Role, resource: string, action: string): boolean {
  return PERMISSIONS[resource]?.[action]?.includes(role) ?? false
}

// Wrapper Server Action
export function withPermission<T>(
  resource: string,
  action: string,
  handler: (session: Session, ...args: any[]) => Promise<T>
) {
  return async (...args: any[]) => {
    const session = await auth()
    if (!session) throw new Error('Non authentifié')
    if (!can(session.user.role, resource, action)) {
      throw new Error('Permission refusée')
    }
    return handler(session, ...args)
  }
}
```

### 2.3 Pages d'Authentification à Créer

| Route | Description |
|-------|-------------|
| `/login` | Connexion email + password, Magic Link, Google |
| `/register` | Auto-inscription (invitation par lien) |
| `/forgot-password` | Demande de réinitialisation |
| `/reset-password/[token]` | Nouvelle saisie du mot de passe |
| `/verify-email/[token]` | Vérification d'adresse email |
| `/two-factor` | Saisie du code TOTP |

---

## Phase 1 — MVP (Mois 1-3)

---

## Étape 3 — Dashboard Super Administrateur

### 3.1 Pages et Fonctionnalités

| Route | Composant | Description |
|-------|-----------|-------------|
| `/super-admin` | `SuperAdminDashboard` | KPIs globaux, activité récente |
| `/super-admin/schools` | `SchoolsTable` | Liste + filtres + pagination |
| `/super-admin/schools/new` | `CreateSchoolForm` | Formulaire onboarding guidé |
| `/super-admin/schools/[id]` | `SchoolDetail` | Détail + historique actions |
| `/super-admin/plans` | `PlansManager` | Configuration plans tarifaires |
| `/super-admin/subscriptions` | `SubscriptionsTable` | Abonnements actifs, MRR |
| `/super-admin/monitoring` | `MonitoringDashboard` | Sentry, logs, erreurs |

### 3.2 Server Actions Clés

```typescript
// actions/schools.ts
createSchool(data)        // Crée école + schéma + admin
updateSchool(id, data)    // Mise à jour infos école
suspendSchool(id, reason) // Suspend + notification admin école
deleteSchool(id)          // Soft delete + archivage données
changePlan(schoolId, planId) // Upgrade/downgrade
extendTrial(schoolId, days)  // Prolonger période essai
```

### 3.3 Composants UI

- `<KPICard>` — Carte métrique (MRR, ARR, nb écoles actives, churn)
- `<SchoolStatusBadge>` — Badge coloré statut TRIAL/ACTIVE/SUSPENDED
- `<SchoolsMap>` — Carte géographique (react-leaflet ou Mapbox)
- `<RevenueChart>` — Graphique revenus mensuels (recharts)
- `<ActivityFeed>` — Dernières actions sur la plateforme

---

## Étape 4 — Dashboard Administrateur École

### 4.1 Pages et Fonctionnalités

| Route | Description |
|-------|-------------|
| `/admin` | Vue d'ensemble : effectifs, finances, alertes |
| `/admin/settings` | Paramétrage général établissement |
| `/admin/academic-years` | Gestion années scolaires + trimestres |
| `/admin/levels` | Niveaux et séries/filières |
| `/admin/classes` | Création et configuration des classes |
| `/admin/subjects` | Matières et coefficients par niveau |
| `/admin/teachers` | Gestion enseignants + attributions |
| `/admin/schedule` | Éditeur emploi du temps drag & drop |
| `/admin/students` | Liste élèves, fiches, inscriptions |
| `/admin/students/new` | Formulaire inscription individuelle |
| `/admin/students/import` | Import CSV/Excel en masse |
| `/admin/parents` | Gestion parents, liaison élèves |
| `/admin/fees` | Configuration types de frais |

### 4.2 Composants Clés

- `<ScheduleEditor>` — Drag & drop avec `@dnd-kit`, détection conflits
- `<StudentImporter>` — Upload CSV + prévisualisation + validation
- `<ClassCard>` — Carte classe avec effectif, titulaire, taux présence
- `<SchoolSettingsForm>` — Upload logo, signature, informations légales

### 4.3 Server Actions Clés

```typescript
// Académique
createAcademicYear(data)
createClass(data)
assignTeacherToClass(teacherId, subjectId, classId)
importStudentsFromCSV(file)
associateParentToStudent(parentId, studentId, relation)

// Emploi du temps
createScheduleSlot(data)
detectScheduleConflicts(classId, teacherId, slot)
exportScheduleToPDF(classId)
```

---

## Étape 5 — Module Notes & Moyennes

### 5.1 Pages

| Route | Description |
|-------|-------------|
| `/teacher/grades` | Sélection classe + matière |
| `/teacher/grades/[classId]/[subjectId]` | Grille de saisie des notes |
| `/admin/grades/overview` | Vue consolidée par classe/niveau |

### 5.2 Grille de Saisie (type tableur)

```typescript
// components/grades/GradeGrid.tsx
// - Tableau avec colonnes : Élève | Devoir 1 | DS 1 | Compo 1 | Moyenne
// - Saisie cellule par cellule avec navigation clavier (Tab, Enter)
// - Auto-calcul moyenne en temps réel
// - Indicateur couleur : rouge < 10, orange 10-12, vert > 12
// - Enregistrement automatique (debounce 1s)
// - Import depuis fichier Excel
// - Bouton "Publier" pour rendre visible aux parents/élèves
```

### 5.3 Algorithme de Calcul des Moyennes

```typescript
// lib/grades/calculator.ts
export function calculateSubjectAverage(grades: Grade[]): number {
  const totalWeight = grades.reduce((sum, g) => sum + g.coefficient, 0)
  const totalWeighted = grades.reduce((sum, g) => sum + (g.value / g.maxValue * 20) * g.coefficient, 0)
  return totalWeight > 0 ? totalWeighted / totalWeight : 0
}

export function calculateGeneralAverage(
  subjectAverages: { average: number; coefficient: number }[]
): number {
  const totalCoeff = subjectAverages.reduce((sum, s) => sum + s.coefficient, 0)
  const totalWeighted = subjectAverages.reduce((sum, s) => sum + s.average * s.coefficient, 0)
  return totalCoeff > 0 ? totalWeighted / totalCoeff : 0
}

export function getAppreciation(average: number): string {
  if (average >= 16) return 'Très Bien'
  if (average >= 14) return 'Bien'
  if (average >= 12) return 'Assez Bien'
  if (average >= 10) return 'Passable'
  return 'Insuffisant'
}
```

### 5.4 Server Actions

```typescript
saveGrade(data)              // Créer / mettre à jour une note
publishGrades(termId, classId, subjectId) // Publier → notification
importGradesFromExcel(file, classId, subjectId)
getClassGradesGrid(classId, subjectId, termId)
getStudentReport(studentId, termId)
```

---

## Étape 6 — Module Présences

### 6.1 Pages

| Route | Description |
|-------|-------------|
| `/teacher/attendance` | Sélection cours du jour |
| `/teacher/attendance/[scheduleId]/[date]` | Feuille de présence |
| `/admin/attendance` | Vue globale par classe/période |
| `/parent/children/[id]/attendance` | Historique présences enfant |

### 6.2 Feuille de Présence Numérique

```typescript
// components/attendance/AttendanceSheet.tsx
// - Liste alphabétique des élèves de la classe
// - 4 boutons par élève : Présent (vert) / Absent (rouge) / Retard (orange) / Sorti (gris)
// - Marquage rapide : clic = présent, double-clic = absent
// - Bouton "Tout présent" pour initialiser
// - Indicateur nombre d'absences
// - Enregistrement et déclenchement automatique notification parents
// - Export PDF de la feuille
```

### 6.3 Server Actions

```typescript
recordAttendance(scheduleId, date, records)  // Tableau [{studentId, status}]
justifyAbsence(attendanceId, justification)
getAttendanceStats(classId, termId)
getStudentAttendanceHistory(studentId, termId)
notifyParentsOfAbsence(attendanceRecords)    // Déclenche email + SMS
```

---

## Étape 7 — Génération de Bulletins PDF

### 7.1 Template Bulletin

```typescript
// components/pdf/ReportCard.tsx (@react-pdf/renderer)
export function ReportCard({ student, term, grades, school }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* En-tête : Logo école, nom établissement, tampon */}
        <SchoolHeader school={school} />

        {/* Informations élève */}
        <StudentInfo student={student} term={term} />

        {/* Tableau des notes par matière */}
        <GradesTable grades={grades} />

        {/* Résumé : Moyenne générale, Rang, Appréciation */}
        <Summary grades={grades} />

        {/* Absences du trimestre */}
        <AttendanceSummary studentId={student.id} termId={term.id} />

        {/* Signature directeur */}
        <DirectorSignature school={school} />
      </Page>
    </Document>
  )
}
```

### 7.2 Fonctionnalités

- Génération individuelle (un élève)
- Génération en masse (classe entière) → ZIP de PDFs
- Envoi automatique par email aux parents
- Stockage dans Cloudflare R2
- Signature électronique du directeur
- Modèles personnalisables (logo, couleurs, mentions honorifiques)

### 7.3 Server Actions

```typescript
generateReportCard(studentId, termId)           // Un bulletin
generateClassReportCards(classId, termId)       // Classe entière
sendReportCardsToParents(classId, termId)        // Email + notification
downloadReportCardsZip(classId, termId)         // ZIP téléchargeable
```

---

## Étape 8 — Dashboards Enseignant & Parent (MVP)

### 8.1 Dashboard Enseignant (MVP)

| Section | Contenu |
|---------|---------|
| Accueil | Cours du jour, tâches en attente (présences à faire), dernières notes |
| Mes classes | Liste des classes avec accès rapide présences/notes |
| Notes | Grille de saisie (étape 5) |
| Présences | Feuilles de présence (étape 6) |
| Bulletins | Aperçu et génération |

### 8.2 Dashboard Parent (MVP)

| Section | Contenu |
|---------|---------|
| Accueil | Résumé par enfant : moyenne, absences récentes, prochains devoirs |
| Notes | Notes et moyennes par matière + trimestre |
| Présences | Historique avec justification en ligne |
| Bulletins | Téléchargement PDF des bulletins disponibles |
| Emploi du temps | Planning hebdomadaire de l'enfant |

### 8.3 Dashboard Élève (MVP)

| Section | Contenu |
|---------|---------|
| Accueil | Moyenne générale, prochains contrôles, devoirs à rendre |
| Mes notes | Notes détaillées par matière |
| Mon emploi du temps | Vue hebdomadaire |
| Annonces | Annonces de l'école et de la classe |

---

## Étape 9 — Paiements Mobile Money

### 9.1 Intégration CinetPay (Agrégateur)

CinetPay supporte Orange Money CI, MTN MoMo, Wave, Moov Money en une seule API.

```typescript
// lib/payments/cinetpay.ts
export async function initiatePayment({
  studentId,
  amount,
  feeTypeId,
  returnUrl,
  notifyUrl,
}: PaymentInitData) {
  const response = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey: process.env.CINETPAY_API_KEY,
      site_id: process.env.CINETPAY_SITE_ID,
      transaction_id: generateTransactionId(),
      amount,
      currency: 'XOF',
      description: `Paiement frais scolaires - ${feeTypeId}`,
      return_url: returnUrl,
      notify_url: notifyUrl,
      customer_id: studentId,
    }),
  })
  return response.json()
}

// app/api/webhooks/cinetpay/route.ts
export async function POST(req: Request) {
  const body = await req.json()
  // Vérifier la signature
  // Mettre à jour le statut du paiement
  // Générer le reçu PDF
  // Notifier le parent et le comptable
}
```

### 9.2 Reçu PDF Automatique

```typescript
// components/pdf/PaymentReceipt.tsx
// - Numéro de reçu unique
// - Informations école (logo, cachet)
// - Informations élève et parent
// - Détail du paiement (type de frais, montant, date)
// - Mode de paiement (Orange Money, Wave, etc.)
// - Signature du comptable (optionnelle)
```

---

## Étape 10 — Notifications Email & PWA de Base

### 10.1 Templates Email (React Email + Resend)

```typescript
// emails/GradePublished.tsx
// emails/AbsenceAlert.tsx
// emails/ReportCardAvailable.tsx
// emails/PaymentConfirmation.tsx
// emails/PaymentReminder.tsx
// emails/WelcomeEmail.tsx
// emails/PasswordReset.tsx
```

### 10.2 Service de Notification Unifié

```typescript
// lib/notifications/service.ts
export async function sendNotification({
  userId,
  type,
  channels,   // ['email', 'push', 'sms']
  data,
}: NotificationPayload) {
  // Créer l'entrée en base
  await db.notification.create({ data: { userId, type, ...data } })

  // Email
  if (channels.includes('email')) {
    await resend.emails.send(buildEmailForType(type, data))
  }

  // SMS
  if (channels.includes('sms')) {
    await africasTalking.SMS.send(buildSMSForType(type, data))
  }

  // Push (Web Push via Service Worker)
  if (channels.includes('push')) {
    await sendWebPush(userId, data)
  }
}
```

### 10.3 Configuration PWA

```typescript
// next.config.ts — next-pwa
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    // Cache des pages statiques (emploi du temps, notes)
    // Cache réseau first pour les données dynamiques
  ],
})
```

```json
// public/manifest.json
{
  "name": "ClasseLink",
  "short_name": "ClasseLink",
  "theme_color": "#2563EB",
  "background_color": "#ffffff",
  "display": "standalone",
  "start_url": "/",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## Phase 2 — Complet (Mois 4-6)

---

## Étape 11 — Module Devoirs & Rendu en Ligne

### 11.1 Pages

| Route | Description |
|-------|-------------|
| `/teacher/assignments` | Liste devoirs créés |
| `/teacher/assignments/new` | Création devoir |
| `/teacher/assignments/[id]` | Correction + statistiques rendu |
| `/student/assignments` | Devoirs à rendre (triés par date) |
| `/student/assignments/[id]` | Détail + formulaire de rendu |

### 11.2 Fonctionnalités Principales

- Éditeur rich text (description + instructions détaillées)
- Upload de fichiers joints (PDF, Word, images) → Cloudflare R2
- Date limite avec rappels automatiques J-1 et J-0
- Rendu en ligne : upload fichiers étudiants
- Correction directement dans l'interface (note + commentaire)
- Statistiques : taux de rendu, distribution des notes, histogramme

---

## Étape 12 — Cahier de Texte Numérique

### 12.1 Pages

| Route | Description |
|-------|-------------|
| `/teacher/lessons` | Journal des cours (calendrier/liste) |
| `/teacher/lessons/new` | Saisie contenu du cours |
| `/admin/lessons` | Vue globale par classe |
| `/parent/children/[id]/lessons` | Cahier de texte de l'enfant |
| `/student/lessons` | Mes cours et résumés |

### 12.2 Structure d'un Cours

- Matière + Classe + Date
- Titre et résumé du cours
- Contenu détaillé (rich text avec images)
- Travail à la maison
- Planification du prochain cours
- Ressources jointes (liens, documents)

---

## Étape 13 — Module Financier Avancé

### 13.1 Pages Supplémentaires

| Route | Description |
|-------|-------------|
| `/admin/finance` | Tableau de bord financier |
| `/admin/finance/fees` | Configuration frais et échéanciers |
| `/admin/finance/scholarships` | Bourses et exonérations |
| `/admin/finance/reminders` | Configuration relances automatiques |
| `/admin/finance/export` | Exports comptables Excel/CSV |
| `/accountant/payments` | Interface comptable dédiée |

### 13.2 Fonctionnalités Avancées

- Échéanciers de paiement (paiement en plusieurs fois)
- Gestion des bourses et remises par élève
- Relances automatiques configurables (BullMQ) :
  - J-7 avant échéance → email doux
  - J-0 → email + SMS
  - J+7 → email ferme
  - J+30 → email urgent + alerte comptable
- Export CSV/Excel pour logiciel comptable externe
- Tableau de bord : recettes attendues vs encaissées, taux de recouvrement
- Réconciliation automatique CinetPay → base de données

---

## Étape 14 — Messagerie Interne

### 14.1 Interface Messagerie

```typescript
// components/messaging/MessageThread.tsx
// - Liste des conversations (sidebar gauche)
// - Fil de messages (colonne centrale)
// - Formulaire de réponse (bas)
// - Indicateur d'accusé de réception (✓✓)
// - Pièces jointes (upload vers R2)
// - Archivage des conversations
// - Badge non-lu en temps réel (Polling ou Server-Sent Events)
```

### 14.2 Contexte des Conversations

Chaque conversation est liée à un contexte :
- **Parent ↔ Enseignant** : associé à un élève spécifique
- **Parent ↔ Direction** : général ou lié à un dossier
- **Enseignant ↔ Direction** : général

---

## Étape 15 — Dashboard Super Admin Complet

### 15.1 Fonctionnalités Complémentaires

- Carte géographique interactive des écoles (Leaflet.js)
- KPIs business complets : MRR, ARR, Churn, LTV, CAC
- Monitoring Sentry intégré dans le dashboard
- Logs d'audit global avec filtres avancés
- Gestion des codes promotionnels (PROMO_CODE model)
- Rapports d'utilisation par école (élèves actifs, notes saisies, connexions)
- Gestion des impayés SaaS avec relances

---

## Étape 16 — Analytics & Reporting Avancé

### 16.1 Rapports Académiques

```typescript
// Rapport de classe : moyenne, taux de réussite, top élèves
// Rapport de matière : distribution des notes, évolution
// Rapport d'élève : progression sur les trimestres, indicateur décrochage
// Rapport de présence : taux par classe, élèves à risque
```

### 16.2 Exports Automatisés

- Exports PDF : bulletins, relevés de notes, attestations de scolarité
- Exports Excel : listes de classe, notes complètes, paiements
- Rapports programmés : envoi automatique hebdo/mensuel au directeur

### 16.3 Alertes Intelligentes

- Classe dont la moyenne est en baisse (> 10% sur 2 semaines)
- Élève avec taux d'absence > 20%
- Impayés dépassant 60 jours
- Devoir non corrigé depuis 7 jours après rendu

---

## Étape 17 — SMS & Inscriptions en Ligne

### 17.1 Intégration AfricasTalking (SMS)

```typescript
// lib/notifications/sms.ts
import AfricasTalking from 'africastalking'

const at = AfricasTalking({
  apiKey: process.env.AT_API_KEY!,
  username: process.env.AT_USERNAME!,
})

export async function sendSMS(to: string, message: string) {
  return at.SMS.send({
    to: [formatPhoneCI(to)],  // Normaliser numéro ivoirien
    message,
    from: process.env.AT_SHORTCODE,
  })
}
```

### 17.2 Page d'Inscription en Ligne

```
/[school-slug]/enroll — Page publique personnalisée par école
```

Étapes du formulaire :
1. Informations de l'élève (nom, prénom, date naissance, niveau souhaité)
2. Informations des parents/tuteurs
3. Pièces justificatives (extrait naissance, photo, relevé de notes)
4. Paiement des frais d'inscription en ligne (optionnel)
5. Confirmation et numéro de dossier

---

## Étape 18 — Conseil de Classe Numérique

### 18.1 Fonctionnalités

| Fonctionnalité | Description |
|----------------|-------------|
| Planification | Création des conseils par trimestre, invitation des participants |
| Tableau de bord conseil | Moyennes, présences, appréciations pré-remplies |
| Saisie des appréciations | Appréciation par élève + appréciation générale de la classe |
| Décisions | Passage, redoublement, félicitations, encouragements |
| PV numérique | Génération PDF du procès-verbal |
| Signatures | Signature électronique des participants |

---

## Phase 3 — Avancé (Mois 7-12)

| Module | Description | Priorité |
|--------|-------------|----------|
| Bibliothèque | Gestion des livres, prêts, retours | Haute |
| Infirmerie | Registre santé, visites, traitements | Moyenne |
| Détection décrochage IA | Score de risque élève (notes + présences) | Haute |
| Google Calendar | Sync emploi du temps + rendez-vous | Moyenne |
| WhatsApp Business | Notifications WhatsApp | Haute |
| React Native | Application mobile native | Haute |
| API publique | Endpoints REST documentés + clés API | Moyenne |
| Transport scolaire | Gestion bus, trajets, élèves | Basse |

### Module Détection Décrochage (IA Simple)

```typescript
// lib/analytics/dropout-detection.ts
export function calculateDropoutRisk(student: StudentStats): DropoutRisk {
  let score = 0

  // Facteur présence (poids 40%)
  if (student.absenceRate > 0.2) score += 40
  else if (student.absenceRate > 0.1) score += 20

  // Facteur notes (poids 40%)
  if (student.generalAverage < 7) score += 40
  else if (student.generalAverage < 10) score += 20

  // Facteur progression (poids 20%)
  if (student.averageTrend < -2) score += 20  // Baisse > 2 points

  return {
    level: score >= 60 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW',
    score,
    factors: buildRiskFactors(student),
  }
}
```

---

## Stratégie de Tests

### Types de Tests

```
tests/
├── unit/           # Tests unitaires (calculateurs, utilitaires)
├── integration/    # Tests Server Actions + base de données
├── e2e/            # Tests Playwright (flux complets)
└── __mocks__/      # Mocks des services externes
```

### Couverture Minimale Requise

| Module | Type | Couverture cible |
|--------|------|-----------------|
| Calcul moyennes | Unit | 100% |
| Auth / RBAC | Unit + Integration | 90% |
| Paiements | Integration | 80% |
| Génération bulletins | Integration | 80% |
| Flux inscription | E2E | Tous les chemins critiques |
| Flux paiement | E2E | Golden path + erreurs |

### Commandes

```bash
npm run test           # Unit + Integration (Jest/Vitest)
npm run test:e2e       # Playwright
npm run test:coverage  # Rapport de couverture
```

---

## Déploiement & CI/CD

### Pipeline GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI/CD ClasseLink

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test

  deploy-preview:
    if: github.event_name == 'pull_request'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-args: '--prod'
```

### Environnements

| Env | Branche | URL | Base de données |
|-----|---------|-----|-----------------|
| Development | `develop` | localhost:3000 | Neon (branch dev) |
| Staging | `staging` | staging.classelink.ci | Neon (branch staging) |
| Production | `main` | classelink.ci | Neon (production) |

### Checklist Déploiement Production

- [ ] Variables d'environnement toutes configurées sur Vercel
- [ ] Migrations Prisma appliquées sur Neon production
- [ ] DNS configurés (domaine + wildcards pour sous-domaines)
- [ ] Certificats SSL actifs (Cloudflare)
- [ ] Sentry configuré et alertes actives
- [ ] Backup automatique Neon activé
- [ ] Rate limiting Redis Upstash configuré
- [ ] Tests E2E passés sur staging

---

## Conventions de Code

### Nommage

| Élément | Convention | Exemple |
|---------|------------|---------|
| Composants | PascalCase | `GradeGrid.tsx` |
| Hooks | camelCase + `use` | `useStudentGrades.ts` |
| Server Actions | camelCase | `saveGrade.ts` |
| Types | PascalCase | `StudentWithGrades` |
| Constantes | SCREAMING_SNAKE | `MAX_STUDENTS` |
| Routes | kebab-case | `/admin/academic-years` |

### Structure d'un Server Action

```typescript
// actions/grades.ts
'use server'

import { auth } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/db/tenant'
import { saveGradeSchema } from '@/lib/validations/grades'
import { revalidatePath } from 'next/cache'

export async function saveGrade(input: unknown) {
  // 1. Authentification
  const session = await auth()
  if (!session) throw new Error('Non authentifié')

  // 2. Validation
  const data = saveGradeSchema.parse(input)

  // 3. Vérification permissions
  if (!['ADMIN', 'TEACHER'].includes(session.user.role)) {
    throw new Error('Permission refusée')
  }

  // 4. Opération base de données
  const db = getTenantPrisma(session.user.schemaName)
  const grade = await db.grade.upsert({
    where: { id: data.id ?? '' },
    update: data,
    create: { ...data, createdBy: session.user.id },
  })

  // 5. Audit log
  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: data.id ? 'UPDATE' : 'CREATE',
      resource: 'GRADE',
      resourceId: grade.id,
    },
  })

  // 6. Invalider le cache
  revalidatePath('/teacher/grades')

  return { success: true, grade }
}
```

### Gestion des Erreurs

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message)
  }
}

export class UnauthorizedError extends AppError {
  constructor() {
    super('Non autorisé', 'UNAUTHORIZED', 401)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} non trouvé`, 'NOT_FOUND', 404)
  }
}
```

---

## Récapitulatif des Étapes

| # | Étape | Phase | Durée estimée | Priorité |
|---|-------|-------|---------------|----------|
| 0 | Initialisation & Configuration | Setup | 2 jours | Critique |
| 1 | Base de données & Multitenant | Setup | 3 jours | Critique |
| 2 | Authentification & RBAC | Setup | 3 jours | Critique |
| 3 | Dashboard Super Admin | MVP | 4 jours | Haute |
| 4 | Dashboard Admin École | MVP | 5 jours | Haute |
| 5 | Module Notes & Moyennes | MVP | 4 jours | Haute |
| 6 | Module Présences | MVP | 3 jours | Haute |
| 7 | Génération Bulletins PDF | MVP | 3 jours | Haute |
| 8 | Dashboards Enseignant/Parent/Élève (MVP) | MVP | 4 jours | Haute |
| 9 | Paiements Mobile Money | MVP | 3 jours | Haute |
| 10 | Notifications Email & PWA | MVP | 2 jours | Haute |
| 11 | Module Devoirs | Phase 2 | 3 jours | Moyenne |
| 12 | Cahier de Texte | Phase 2 | 2 jours | Moyenne |
| 13 | Module Financier Avancé | Phase 2 | 4 jours | Moyenne |
| 14 | Messagerie Interne | Phase 2 | 3 jours | Moyenne |
| 15 | Super Admin Complet | Phase 2 | 2 jours | Moyenne |
| 16 | Analytics & Reporting | Phase 2 | 4 jours | Moyenne |
| 17 | SMS & Inscriptions en Ligne | Phase 2 | 3 jours | Moyenne |
| 18 | Conseil de Classe | Phase 2 | 2 jours | Basse |
| 19+ | Phase 3 (IA, Mobile, API) | Phase 3 | Mois 7-12 | Variable |

---

*Plan généré le 17 mai 2026 — basé sur ClasseLink CdC v2.0*
