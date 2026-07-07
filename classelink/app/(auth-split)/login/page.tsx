import type { Metadata } from 'next'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Connexion — MyClassLink' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>
}) {
  const params = await searchParams
  return <LoginForm error={params.error} callbackUrl={params.callbackUrl} />
}
