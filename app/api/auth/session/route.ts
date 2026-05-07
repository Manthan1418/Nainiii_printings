import { NextResponse } from 'next/server'
import { auth } from '../../../../lib/firebaseAdmin'

export async function POST(req: Request) {
  const { idToken } = await req.json()
  try {
    const decoded = await auth.verifyIdToken(idToken)
    const res = NextResponse.json({ ok: true })
    // set cookie (httpOnly)
    res.cookies.set('nainiii_token', idToken, { httpOnly: true, path: '/', sameSite: 'lax' })
    return res
  } catch (e) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('nainiii_token')
  return res
}
