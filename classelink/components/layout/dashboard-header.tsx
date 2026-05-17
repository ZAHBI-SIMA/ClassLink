import { auth } from '@/lib/auth'
import { getInitials } from '@/lib/utils'

interface Props {
  title?: string
}

export async function DashboardHeader({ title }: Props) {
  const session = await auth()
  const user = session?.user

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 flex-shrink-0">
      {title && (
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      )}

      <div className="ml-auto flex items-center gap-4">
        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          aria-label="Notifications"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {/* Badge */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Avatar utilisateur */}
        {user && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
              {user.image
                ? <img src={user.image} alt="" className="w-8 h-8 rounded-full object-cover" />
                : getInitials(
                    (user as any).firstName ?? user.name?.split(' ')[0] ?? 'U',
                    (user as any).lastName ?? user.name?.split(' ')[1] ?? ''
                  )
              }
            </div>
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900 leading-tight">
                {user.name ?? `${(user as any).firstName} ${(user as any).lastName}`}
              </p>
              <p className="text-xs text-gray-500 leading-tight">{user.email}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
