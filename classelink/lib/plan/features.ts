/**
 * Accès aux fonctionnalités selon le forfait souscrit.
 *
 * Depuis la refonte tarifaire (forfaits annuels par type d'établissement :
 * primaire / collège-lycée / groupe-scolaire), il n'existe plus de palier
 * de fonctionnalités : toute école dont l'abonnement est actif a accès à
 * l'intégralité de la plateforme. Ce module ne fait donc plus que du
 * passthrough, conservé pour ne pas casser les points d'appel existants.
 */

export type Feature = string

/** Toujours vrai : plus de gating par fonctionnalité côté école. */
export function hasFeature(_slug: string | null | undefined, _feature: Feature): boolean {
  return true
}

/** Plus de fonctionnalité associée à un chemin : aucune route n'est verrouillée par le plan. */
export function featureForPath(_pathname: string): Feature | null {
  return null
}
