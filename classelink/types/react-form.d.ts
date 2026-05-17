import 'react'

declare module 'react' {
  interface FormHTMLAttributes<T> {
    // Next.js Server Actions can return non-void values; widen the type to allow it
    action?: string | ((formData: FormData) => unknown) | undefined
  }
}
