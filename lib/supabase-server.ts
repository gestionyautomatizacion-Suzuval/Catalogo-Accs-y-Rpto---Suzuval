import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Cliente para Rutas de App Router (API, Layouts, Server Actions) que respeta la sesión (RLS)
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Ignorar en server components (SSR)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Ignorar
          }
        },
      },
    }
  )
}

// Cliente Admin (Service Role): Salta el RLS de Supabase. 
// SOLO USAR EN ENDPOINTS SEGUROS (como Webhooks autenticados o scripts de crons)
export function createAdminClient() {
  // Para un cliente de admin puro que no depende de cookies:
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get() { return null },
        set() {},
        remove() {},
      },
      auth: {
        persistSession: false,
      }
    }
  )
}
