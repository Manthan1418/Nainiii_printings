import { NextResponse } from 'next/server'
import { firestore } from '../../../../lib/firebaseAdmin'

export const runtime = 'nodejs'

export async function GET() {
  const snap = await firestore.collection('receipts').orderBy('date', 'desc').get()
  const rec = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
  return NextResponse.json(rec)
}

export async function POST(req: Request) {
  const body = await req.json()
  const docRef = await firestore.collection('receipts').add({ ...body, date: body.date ?? new Date().toISOString() })
  const doc = await docRef.get()
  return NextResponse.json({ id: doc.id, ...(doc.data() as any) })
}
