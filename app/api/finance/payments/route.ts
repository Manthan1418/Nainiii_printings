import { NextResponse } from 'next/server'
import { firestore } from '../../../../lib/firebaseAdmin'

export const runtime = 'nodejs'

export async function GET() {
  const snap = await firestore.collection('payments').orderBy('date', 'desc').get()
  const p = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
  return NextResponse.json(p)
}

export async function POST(req: Request) {
  const body = await req.json()
  const docRef = await firestore.collection('payments').add({ ...body, date: body.date ?? new Date().toISOString() })
  const doc = await docRef.get()
  return NextResponse.json({ id: doc.id, ...(doc.data() as any) })
}
