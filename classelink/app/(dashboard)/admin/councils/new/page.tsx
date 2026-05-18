import { getCouncilFormData } from '@/actions/council'
import { PageHeader } from '@/components/ui/page-header'
import { CreateCouncilForm } from './create-council-form'
import Link from 'next/link'

export default async function NewCouncilPage() {
  const { classes, terms } = await getCouncilFormData()

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Nouveau conseil de classe"
        description="Planifiez un conseil de classe pour une classe et un trimestre"
        action={
          <Link href="/admin/councils"
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition">
            ← Retour
          </Link>
        }
      />

      {classes.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800">
          <p className="font-semibold mb-1">Aucune classe disponible</p>
          <p>Aucune classe n'est configurée pour l'année scolaire courante.
            <Link href="/admin/classes" className="underline ml-1">Créer des classes →</Link>
          </p>
        </div>
      ) : (
        <CreateCouncilForm classes={classes} terms={terms} />
      )}
    </div>
  )
}
