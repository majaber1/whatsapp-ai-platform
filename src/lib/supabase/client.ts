import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Singleton instance — one client shared across the whole browser session.
// Creating multiple clients causes auth-lock contention ("Lock was released
// because another request stole it") and intermittent fetch failures.
let browserClient: SupabaseClient | undefined

export function createClient() {
  if (browserClient) return browserClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseOrigin = new URL(supabaseUrl).origin

  const proxiedFetch: typeof fetch = async (input, init) => {
    const request = new Request(input, init)
    const target = new URL(request.url)

    // Some corporate networks / DNS filters block direct browser access to
    // *.supabase.co even though the Vercel runtime can reach it. Route normal
    // Supabase HTTP traffic through our own origin so auth / REST / Storage
    // remain reachable without changing the backend or exposing privileged
    // credentials. Realtime WebSocket traffic is intentionally untouched.
    if (target.origin === supabaseOrigin) {
      const proxyUrl = new URL(
        `/api/supabase-proxy${target.pathname}${target.search}`,
        window.location.origin
      )
      return fetch(new Request(proxyUrl, request))
    }

    return fetch(request)
  }

  browserClient = createBrowserClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: proxiedFetch,
      },
    }
  )

  return browserClient
}
