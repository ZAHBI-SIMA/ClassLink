import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Connexion',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Image
              src="/logo.png"
              alt="MyClassLink"
              width={2000}
              height={2000}
              priority
              className="h-16 w-auto mx-auto"
            />
          </Link>
        </div>

        {/* Carte */}
        <div className="bg-white rounded-2xl shadow-xl p-8">{children}</div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} MyClassLink · Côte d&apos;Ivoire
        </p>
      </div>
    </div>
  )
}
