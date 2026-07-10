import type { Role } from '@/types'

/**
 * Accès granulaire par module pour le personnel (rôle STAFF).
 *
 * Les rôles « pleins » (ADMIN/CENSOR/ACCOUNTANT) conservent leur périmètre actuel.
 * Un STAFF n'a accès qu'aux modules explicitement listés dans `allowed_modules`.
 * Le module `settings` n'est jamais assignable (réservé ADMIN).
 *
 * Calqué sur le pattern de gating par forfait (lib/plan/features.ts).
 */

export type ModuleCategory =
  | 'Vie scolaire'
  | 'Pédagogie'
  | 'Finances'
  | 'Communication'
  | 'Ressources'
  | 'Configuration'

export interface ModuleDef {
  key:      string
  label:    string
  prefix:   string        // préfixe d'URL de l'espace admin
  category: ModuleCategory
}

/** Catalogue des modules assignables au personnel (dérivé de la NAV admin). */
export const MODULES: ModuleDef[] = [
  // Vie scolaire
  { key: 'students',     label: 'Élèves',            prefix: '/admin/students',     category: 'Vie scolaire' },
  { key: 'attendance',   label: 'Présences',         prefix: '/admin/attendance',   category: 'Vie scolaire' },
  { key: 'teacher-attendance', label: 'Présence enseignants', prefix: '/admin/teacher-attendance', category: 'Vie scolaire' },
  { key: 'sanctions',    label: 'Sanctions',         prefix: '/admin/sanctions',    category: 'Vie scolaire' },
  { key: 'enrollments',  label: 'Inscriptions',      prefix: '/admin/enrollments',  category: 'Vie scolaire' },
  { key: 'convocations', label: 'Convocations',      prefix: '/admin/convocations', category: 'Vie scolaire' },
  { key: 'rewards',      label: 'Récompenses',       prefix: '/admin/rewards',      category: 'Vie scolaire' },

  // Pédagogie
  { key: 'teachers',       label: 'Enseignants',      prefix: '/admin/teachers',       category: 'Pédagogie' },
  { key: 'grades',         label: 'Notes & Moyennes', prefix: '/admin/grades',         category: 'Pédagogie' },
  { key: 'subjects',       label: 'Matières',         prefix: '/admin/subjects',       category: 'Pédagogie' },
  { key: 'classes',        label: 'Classes',          prefix: '/admin/classes',        category: 'Pédagogie' },
  { key: 'levels',         label: 'Niveaux',          prefix: '/admin/levels',         category: 'Pédagogie' },
  { key: 'academic-years', label: 'Années scolaires', prefix: '/admin/academic-years', category: 'Pédagogie' },
  { key: 'schedule',       label: 'Emploi du temps',  prefix: '/admin/schedule',       category: 'Pédagogie' },
  { key: 'councils',       label: 'Conseils de classe', prefix: '/admin/councils',     category: 'Pédagogie' },
  { key: 'agenda',         label: 'Agenda',           prefix: '/admin/agenda',         category: 'Pédagogie' },

  // Finances
  { key: 'payments',     label: 'Paiements',          prefix: '/admin/payments',     category: 'Finances' },
  { key: 'fees',         label: 'Frais scolaires',    prefix: '/admin/fees',         category: 'Finances' },
  { key: 'finance',      label: 'Finance & rapports', prefix: '/admin/finance',      category: 'Finances' },
  { key: 'scholarships', label: 'Bourses',            prefix: '/admin/scholarships', category: 'Finances' },
  { key: 'analytics',    label: 'Analytics',          prefix: '/admin/analytics',    category: 'Finances' },

  // Communication
  { key: 'assistant',     label: 'Assistant IA', prefix: '/admin/assistant',  category: 'Communication' },
  { key: 'ai-supervision', label: 'Supervision IA', prefix: '/admin/ai-supervision', category: 'Communication' },
  { key: 'announcements', label: 'Annonces',  prefix: '/admin/announcements', category: 'Communication' },
  { key: 'messages',      label: 'Messages',  prefix: '/admin/messages',      category: 'Communication' },
  { key: 'alerts',        label: 'Alertes',   prefix: '/admin/alerts',        category: 'Communication' },

  // Ressources
  { key: 'library',   label: 'Bibliothèque', prefix: '/admin/library',   category: 'Ressources' },
  { key: 'cafeteria', label: 'Cantine',      prefix: '/admin/cafeteria', category: 'Ressources' },
  { key: 'resources', label: 'Ressources',   prefix: '/admin/resources', category: 'Ressources' },
  { key: 'trips',     label: 'Sorties',      prefix: '/admin/trips',     category: 'Ressources' },
  { key: 'parents',   label: 'Parents',      prefix: '/admin/parents',   category: 'Vie scolaire' },
]

const MODULE_KEYS = new Set(MODULES.map(m => m.key))

/** Rôles « pleins » : périmètre inchangé, accès à tout leur espace. */
const FULL_ACCESS_ROLES: Role[] = ['ADMIN', 'CENSOR', 'ACCOUNTANT', 'SUPER_ADMIN']

/** Module requis pour un chemin admin donné (null = page « cœur », toujours accessible). */
export function moduleForPath(pathname: string): string | null {
  // Le module le plus spécifique d'abord (préfixes les plus longs)
  const match = [...MODULES]
    .sort((a, b) => b.prefix.length - a.prefix.length)
    .find(m => pathname === m.prefix || pathname.startsWith(m.prefix + '/'))
  return match?.key ?? null
}

/** Un membre peut-il accéder à un module ? Les rôles pleins : toujours. STAFF : selon sa liste. */
export function hasModule(role: Role | string, allowedModules: string[] | null | undefined, moduleKey: string | null): boolean {
  if (!moduleKey) return true                          // page cœur (tableau de bord, etc.)
  if (FULL_ACCESS_ROLES.includes(role as Role)) return true
  if (role !== 'STAFF') return false
  return (allowedModules ?? []).includes(moduleKey)
}

/** Filtre une liste de clés en ne gardant que des modules valides (anti-injection). */
export function sanitizeModules(keys: string[]): string[] {
  return Array.from(new Set(keys.filter(k => MODULE_KEYS.has(k))))
}

// ─── Postes prédéfinis & presets de modules ──────────────────────────────────

export interface JobPreset {
  title:   string
  level:   'Primaire' | 'Secondaire' | 'Commun'
  modules: string[]
}

const ALL = MODULES.map(m => m.key)

export const JOB_PRESETS: JobPreset[] = [
  // ── Primaire ──
  { title: "Directeur / Directrice d'école",  level: 'Primaire', modules: ALL },
  { title: 'Directeur adjoint',               level: 'Primaire', modules: ['students','attendance','teacher-attendance','grades','schedule','sanctions','enrollments','announcements','messages'] },
  { title: 'Secrétaire',                      level: 'Primaire', modules: ['students','enrollments','announcements','messages'] },
  { title: 'Comptable / Régisseur',           level: 'Primaire', modules: ['payments','fees','finance','scholarships','cafeteria'] },
  { title: 'Surveillant(e)',                  level: 'Primaire', modules: ['attendance','sanctions'] },
  { title: 'Cuisinier(ère)',                  level: 'Primaire', modules: ['cafeteria'] },
  { title: 'Infirmier(ère) scolaire',         level: 'Primaire', modules: ['students','announcements'] },

  // ── Secondaire ──
  { title: 'Proviseur / Principal',           level: 'Secondaire', modules: ALL },
  { title: 'Proviseur adjoint / Censeur',     level: 'Secondaire', modules: ['students','attendance','teacher-attendance','grades','schedule','sanctions','councils','convocations','enrollments'] },
  { title: 'Surveillant général (SG)',        level: 'Secondaire', modules: ['students','attendance','teacher-attendance','sanctions','convocations'] },
  { title: 'Surveillant / Éducateur',         level: 'Secondaire', modules: ['attendance','sanctions'] },
  { title: 'Intendant / Économe',             level: 'Secondaire', modules: ['payments','fees','finance','scholarships','cafeteria','resources'] },
  { title: 'Comptable matières',              level: 'Secondaire', modules: ['resources','library'] },
  { title: 'Conseiller pédagogique',          level: 'Secondaire', modules: ['grades','schedule','councils','subjects'] },
  { title: "Conseiller d'orientation",        level: 'Secondaire', modules: ['students','councils','grades'] },
  { title: 'Chef de département',             level: 'Secondaire', modules: ['grades','schedule','subjects','teachers'] },
  { title: 'Secrétaire de direction',         level: 'Secondaire', modules: ['announcements','messages','convocations'] },
  { title: 'Secrétaire des élèves',           level: 'Secondaire', modules: ['students','enrollments'] },
  { title: 'Documentaliste',                  level: 'Secondaire', modules: ['library'] },
  { title: 'Cuisinier(ère)',                  level: 'Secondaire', modules: ['cafeteria'] },
  { title: 'Infirmier(ère) scolaire',         level: 'Secondaire', modules: ['students','announcements'] },
]
