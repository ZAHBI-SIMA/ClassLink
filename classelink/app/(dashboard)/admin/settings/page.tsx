import { getSchoolSettings, getSubscriptionInfo, getSchoolSlug } from '@/actions/settings'
import { PageHeader } from '@/components/ui/page-header'
import { SettingsForm } from './settings-form'

export const metadata = { title: 'Paramètres — MyClassLink' }

export default async function SettingsPage() {
  const [settings, subscription, schoolSlug] = await Promise.all([
    getSchoolSettings(),
    getSubscriptionInfo().catch(() => null),
    getSchoolSlug().catch(() => null),
  ])

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Paramètres de l'établissement"
        description="Configurez les informations générales, la direction et les notifications."
      />
      <SettingsForm settings={settings} subscription={subscription} schoolSlug={schoolSlug} />
    </div>
  )
}
