import { NextRequest } from 'next/server'

const ALLOWED_PREFIXES = [
  'auth/v1',
  'rest/v1',
  'storage/v1',
  'functions/v1',
  'graphql/v1',
] as const

const REQUEST_HEADER_DENYLIST = new Set([
  'host',
  'cookie',
  'content-length',
  'connection',
  'origin',
  'referer',
  'transfer-encoding',
])

const RESPONSE_HEADER_DENYLIST = new Set([
  'set-cookie',
  'content-length',
  'content-encoding',
  'connection',
  'transfer-encoding',
  'access-control-allow-origin',
  'access-control-allow-credentials',
])

function isAllowedPath(path: string) {
  return ALLOWED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  )
}

async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !anonKey) {
    return Response.json(
      { error: 'Supabase browser proxy is not configured' },
      { status: 500 }
    )
  }

  const marker = '/api/supabase-proxy/'
  const markerIndex = request.nextUrl.pathname.indexOf(marker)
  const relativePath =
    markerIndex >= 0
      ? request.nextUrl.pathname.slice(markerIndex + marker.length)
      : ''

  if (!relativePath || !isAllowedPath(relativePath)) {
    return Response.json({ error: 'Unsupported Supabase path' }, { status: 404 })
  }

  const upstreamUrl = new URL(`/${relativePath}`, supabaseUrl)
  upstreamUrl.search = request.nextUrl.search

  const upstreamHeaders = new Headers()
  request.headers.forEach((value, key) => {
    const normalized = key.toLowerCase()
    if (
      REQUEST_HEADER_DENYLIST.has(normalized) ||
      normalized.startsWith('sec-fetch-') ||
      normalized.startsWith('x-forwarded-')
    ) {
      return
    }
    upstreamHeaders.set(key, value)
  })

  // The anon/publishable credential is public by design, but injecting it
  // server-side keeps the proxy deterministic even if an intermediary strips
  // the browser's apikey header. Never inject the service-role key here.
  upstreamHeaders.set('apikey', anonKey)
  if (!upstreamHeaders.has('authorization')) {
    upstreamHeaders.set('authorization', `Bearer ${anonKey}`)
  }

  const method = request.method.toUpperCase()
  const body =
    method === 'GET' || method === 'HEAD'
      ? undefined
      : await request.arrayBuffer()

  try {
    const upstream = await fetch(upstreamUrl, {
      method,
      headers: upstreamHeaders,
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(30_000),
    })

    const responseHeaders = new Headers()
    upstream.headers.forEach((value, key) => {
      if (!RESPONSE_HEADER_DENYLIST.has(key.toLowerCase())) {
        responseHeaders.set(key, value)
      }
    })
    responseHeaders.set('cache-control', 'no-store')
    responseHeaders.set('x-wacrm-supabase-proxy', '1')

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error('[supabase-proxy] upstream request failed', error)
    return Response.json(
      { error: 'Supabase upstream request failed' },
      { status: 502, headers: { 'cache-control': 'no-store' } }
    )
  }
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const PATCH = proxy
export const DELETE = proxy
export const HEAD = proxy

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS',
      'cache-control': 'no-store',
    },
  })
}
