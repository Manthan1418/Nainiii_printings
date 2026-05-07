import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  // legacy endpoint removed — use Firebase auth at /api/auth/session
  return NextResponse.json({ error: 'use /api/auth/session with idToken' }, { status: 400 })
}
