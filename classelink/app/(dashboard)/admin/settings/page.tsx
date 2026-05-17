import { getSchoolSettings, saveSchoolSettings } from '@/actions/admin'
import { PageHeader } from '@/components/ui/page-header'

export const metadata = { title: 'Paramètres' }

export default async function SettingsPage() {
  const settings = await getSchoolSettings()

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Paramètres de l'établissement"
        description="Configurez les informations générales de votre école."
      />

      <form action={saveSchoolSettings as any} className="space-y-6">
        {/* Informations générales */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-5">Informations générales</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de l&apos;établissement
              </label>
              <input
                name="school_name"
                defaultValue={settings.school_name ?? ''}
                placeholder="Lycée Moderne de Bouaké"

                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type d&apos;établissement</label>
              <select
                name="school_type"
                defaultValue={settings.grade_system ?? ''}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Sélectionner —</option>
                <option value="primaire">Primaire</option>
                <option value="secondaire">Secondaire (Collège)</option>
                <option value="lycee">Lycée</option>
                <option value="technique">Technique & Professionnel</option>
                <option value="superieur">Supérieur</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Devise / Motto</label>
              <input
                name="school_motto"
                defaultValue={''}
                placeholder="Savoir, Savoir-faire, Savoir-être"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom du directeur</label>
              <input
                name="school_director"
                defaultValue={settings.director_name ?? ''}
                placeholder="M. Konan Beugré"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Coordonnées */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-5">Coordonnées</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <input
                name="school_address"
                defaultValue={settings.address ?? ''}
                placeholder="Rue des Écoles, Cocody"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
              <input
                name="school_city"
                defaultValue={settings.city ?? ''}
                placeholder="Abidjan"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  name="school_phone"
                  defaultValue={settings.phone ?? ''}
                  placeholder="+225 27 00 00 00 00"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  name="school_email"
                  type="email"
                  defaultValue={settings.email ?? ''}
                  placeholder="contact@lycee.ci"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm
                     font-semibold rounded-xl transition"
        >
          Sauvegarder les paramètres
        </button>
      </form>
    </div>
  )
}
