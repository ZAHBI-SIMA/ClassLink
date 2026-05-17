import type { Metadata } from 'next'
import { LoginForm } from './login-form'
import { headers } from 'next/headers'
import { getSchemaFromHostname } from '@/lib/db/tenant'

export const metadata: Metadata = { title: 'Connexion' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>
}) {
  const params = await searchParams
  const headersList = await headers()
  const hostname = headersList.get('host') ?? ''
  const schemaName = await getSchemaFromHostname(hostname)

  return (
    <LoginForm
      schemaName={schemaName ?? ''}
      error={params.error}
      callbackUrl={params.callbackUrl}
    />
  )
}
