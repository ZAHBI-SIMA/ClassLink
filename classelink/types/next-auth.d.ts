import type { Role } from './index'
import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface User {
    role: Role
    schemaName: string
    firstName: string
    lastName: string
  }

  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: Role
      schemaName: string
      firstName: string
      lastName: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
    schemaName: string
    firstName: string
    lastName: string
  }
}
