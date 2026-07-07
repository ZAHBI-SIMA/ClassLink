/**
 * Squelette de chargement générique des pages du tableau de bord.
 * Affiché instantanément par les fichiers loading.tsx pendant que la page
 * (dynamique, requêtes BD) se prépare côté serveur — la navigation reste
 * ainsi fluide et interruptible.
 */
export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-4 sm:p-6" aria-busy="true" aria-label="Chargement de la page">
      {/* En-tête : titre + action */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-48 rounded-lg bg-gray-200" />
          <div className="h-3.5 w-72 max-w-[60vw] rounded-md bg-gray-100" />
        </div>
        <div className="hidden h-9 w-32 rounded-xl bg-gray-200 sm:block" />
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-100 bg-white p-4">
            <div className="h-3 w-20 rounded-md bg-gray-100" />
            <div className="mt-3 h-6 w-16 rounded-md bg-gray-200" />
          </div>
        ))}
      </div>

      {/* Bloc principal : tableau / liste */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-6">
        <div className="h-4 w-40 rounded-md bg-gray-200" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-9 w-9 flex-shrink-0 rounded-full bg-gray-100" />
              <div className="h-3.5 flex-1 rounded-md bg-gray-100" />
              <div className="hidden h-3.5 w-24 rounded-md bg-gray-100 sm:block" />
              <div className="h-6 w-16 rounded-full bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Variante compacte pour les pages publiques (paiement, inscription). */
export function CenteredSkeleton() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" aria-busy="true" aria-label="Chargement">
      <div className="flex flex-col items-center gap-3">
        <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-gray-200 border-t-primary" />
        <span className="text-sm text-gray-400">Chargement…</span>
      </div>
    </div>
  )
}
