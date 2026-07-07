import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { PageHeader } from '@/components/ui/page-header'
import { listStaff } from '@/actions/staff'
import { MODULES, JOB_PRESETS } from '@/lib/permissions/modules'
import { StaffClient } from './staff-client'

export const metadata = { title: 'Personnel & accès — MyClassLink' }
export const runtime = 'nodejs'

export default async function StaffPage() {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (role !== 'ADMIN') redirect('/admin')

  const staff = await listStaff().catch(() => [])

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Personnel & accès"
        description="Créez des comptes pour le personnel de l'établissement et choisissez les fonctionnalités accessibles selon leur poste."
      />
      <StaffClient staff={staff} modules={MODULES} presets={JOB_PRESETS} />
    </div>
  )
}
