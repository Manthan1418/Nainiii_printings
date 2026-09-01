import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('nainiii_token')?.value
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 200 })
    }
    return NextResponse.json({ authenticated: true }, { status: 200 })
  } catch (e) {
    return NextResponse.json({ authenticated: false }, { status: 200 })
  }
}

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json()
    // Lazily import to avoid crashing at module level if Firebase env vars are missing
    const { auth } = await import('../../../../lib/firebaseAdmin')
    const decoded = await auth.verifyIdToken(idToken)
    const res = NextResponse.json({ ok: true, uid: decoded.uid })
    res.cookies.set('nainiii_token', idToken, { httpOnly: true, path: '/', sameSite: 'lax' })
    return res
  } catch (e: any) {
    console.error('[session POST]', e?.message ?? e)
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('nainiii_token')
  return res
}
