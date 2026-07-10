import { PageHeader } from '@/components/ui/page-header'
import Link from 'next/link'
import { ImportStudentsForm } from './import-form'

export const metadata = { title: 'Importer des élèves' }

export default function ImportStudentsPage() {
  return (
    <div>
      <PageHeader
        title="Import Excel — Élèves"
        description="Importez en masse plusieurs élèves en une seule opération depuis un fichier Excel (.xlsx) ou CSV."
        action={
          <Link href="/admin/students"
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition">
            ← Retour
          </Link>
        }
      />

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">Format attendu du fichier</h3>
        <p className="text-sm text-blue-700 mb-3">
          Fichier Excel (.xlsx) ou CSV avec les colonnes suivantes en première ligne (en-tête obligatoire) :
        </p>
        <div className="bg-white rounded-lg border border-blue-200 p-3 font-mono text-xs text-gray-700 overflow-x-auto">
          <div className="text-blue-600 font-semibold mb-1">
            prenom | nom | email | date_naissance | genre | classe_id
          </div>
          <div>Awa | Diallo | awa.diallo@example.com | 2008-03-15 | F | cls_2a</div>
          <div>Moussa | Konaté | moussa.konate@example.com | 2008-07-22 | M | cls_2a</div>
          <div>Aïcha | Traoré | aicha.traore@example.com | 2007-11-05 | F | </div>
        </div>
        <ul className="mt-3 text-xs text-blue-700 space-y-1 list-disc list-inside">
          <li><strong>prenom</strong>, <strong>nom</strong>, <strong>email</strong> sont obligatoires</li>
          <li><strong>date_naissance</strong> au format AAAA-MM-JJ</li>
          <li><strong>genre</strong> : M ou F</li>
          <li><strong>classe_id</strong> : l'ID de la classe (optionnel)</li>
          <li>Maximum 1000 élèves par import</li>
          <li>Un mot de passe temporaire sera généré pour chaque élève</li>
        </ul>

        <a
          href="/api/admin/students/import-template"
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-blue-700 font-medium hover:underline"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Télécharger le modèle Excel
        </a>
      </div>

      <ImportStudentsForm />
    </div>
  )
}
