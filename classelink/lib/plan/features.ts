/**
 * Gating des fonctionnalités selon le forfait souscrit.
 *
 * Chaque forfait a un niveau (0..3). Une fonctionnalité a un niveau minimum.
 * Le forfait débloque toutes les fonctionnalités de niveau ≤ au sien.
 */

export type PlanSlug = 'gratuit' | 'starter' | 'pro' | 'entreprise'

export const PLAN_LEVEL: Record<string, number> = {
  gratuit: 0,
  starter: 1,
  pro: 2,
  entreprise: 3,
}

/** Clés de fonctionnalités payantes (les fonctions « core » ne sont pas listées → toujours actives). */
export type Feature =
  | 'payments'    // paiements en ligne, frais
  | 'schedule'    // emplois du temps
  | 'analytics'   // rapports & statistiques avancés
  | 'library'     // bibliothèque
  | 'cafeteria'   // cantine
  | 'resources'   // ressources / salles
  | 'trips'       // sorties scolaires
  | 'councils'    // conseils de classe
  | 'alerts'      // alertes automatiques
  | 'scholarships'// bourses
  | 'rewards'     // récompenses / gamification
  | 'convocations'// convocations
  | 'quiz'        // quiz

/** Niveau minimum requis par fonctionnalité. */
export const FEATURE_MIN_LEVEL: Record<Feature, number> = {
  payments:     1, // Starter+
  schedule:     1, // Starter+
  analytics:    2, // Pro+
  library:      2,
  cafeteria:    2,
  resources:    2,
  trips:        2,
  councils:     2,
  alerts:       2,
  scholarships: 3, // Entreprise
  rewards:      3,
  convocations: 3,
  quiz:         3,
}

export function planLevel(slug?: string | null): number {
  if (!slug) return 0
  return PLAN_LEVEL[slug] ?? 0
}

/** Une fonctionnalité « core » (non listée) est toujours autorisée. */
export function hasFeature(slug: string | null | undefined, feature: Feature): boolean {
  const min = FEATURE_MIN_LEVEL[feature]
  if (min === undefined) return true
  return planLevel(slug) >= min
}

/** Associe un chemin (préfixe d'URL admin) à la fonctionnalité requise. */
export const ROUTE_FEATURE: Array<{ prefix: string; feature: Feature }> = [
  { prefix: '/admin/payments',     feature: 'payments' },
  { prefix: '/admin/fees',         feature: 'payments' },
  { prefix: '/admin/schedule',     feature: 'schedule' },
  { prefix: '/admin/analytics',    feature: 'analytics' },
  { prefix: '/admin/library',      feature: 'library' },
  { prefix: '/admin/cafeteria',    feature: 'cafeteria' },
  { prefix: '/admin/resources',    feature: 'resources' },
  { prefix: '/admin/trips',        feature: 'trips' },
  { prefix: '/admin/councils',     feature: 'councils' },
  { prefix: '/admin/alerts',       feature: 'alerts' },
  { prefix: '/admin/scholarships', feature: 'scholarships' },
  { prefix: '/admin/rewards',      feature: 'rewards' },
  { prefix: '/admin/convocations', feature: 'convocations' },
]

/** Fonctionnalité requise pour un chemin donné (null = accès libre / core). */
export function featureForPath(pathname: string): Feature | null {
  const match = ROUTE_FEATURE.find(r => pathname.startsWith(r.prefix))
  return match?.feature ?? null
}
