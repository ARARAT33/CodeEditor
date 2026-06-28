// GitHub OAuth Device Flow — works without a client secret
// Step 1: POST /api/auth/github → returns device_code, user_code, verification_uri
// Step 2: User goes to verification_uri, enters user_code, authorizes
// Step 3: Frontend polls /api/auth/github?poll=1&device_code=... until access_token is returned

import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CLIENT_ID = 'Ov23liqTkPOCO4ZZ5WcH'

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}))
    const { device_code } = body

    // If device_code is provided, this is a poll request
    if (device_code) {
      const res = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          device_code: device_code,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        }),
      })
      const data = await res.json()

      if (data.error === 'authorization_pending') {
        return Response.json({ ok: true, status: 'pending' })
      }
      if (data.error === 'slow_down') {
        return Response.json({ ok: true, status: 'slow_down', interval: data.interval })
      }
      if (data.error) {
        return Response.json({ ok: false, error: data.error_description || data.error }, { status: 400 })
      }
      if (data.access_token) {
        // Get user info
        const userRes = await fetch('https://api.github.com/user', {
          headers: { Authorization: `Bearer ${data.access_token}`, Accept: 'application/vnd.github+json' },
        })
        const user = userRes.ok ? await userRes.json() : null
        return Response.json({
          ok: true,
          access_token: data.access_token,
          scope: data.scope,
          user: user ? {
            login: user.login,
            name: user.name,
            avatar_url: user.avatar_url,
            html_url: user.html_url,
            public_repos: user.public_repos,
          } : null,
        })
      }
      return Response.json({ ok: false, error: 'Unknown response' }, { status: 500 })
    }

    // Step 1: Request device code
    const res = await fetch('https://github.com/login/device/code', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        scope: 'repo read:user workflow',
      }),
    })
    const data = await res.json()

    if (!data.device_code) {
      return Response.json({ ok: false, error: data.message || 'Failed to start device flow' }, { status: 500 })
    }

    return Response.json({
      ok: true,
      device_code: data.device_code,
      user_code: data.user_code,
      verification_uri: data.verification_uri,
      expires_in: data.expires_in,
      interval: data.interval,
    })
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || 'Server error' }, { status: 500 })
  }
}
