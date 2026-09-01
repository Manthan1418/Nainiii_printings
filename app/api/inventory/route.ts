import { NextResponse } from 'next/server'
import { firestore } from '../../../lib/firebaseAdmin'
import { InventoryCreateSchema } from '../../../validations/inventory'

export const runtime = 'nodejs'

export async function GET() {
  const snap = await firestore.collection('inventoryItems').get()
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  return NextResponse.json(items)
}

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = InventoryCreateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  const docRef = await firestore.collection('inventoryItems').add(parsed.data)
  const doc = await docRef.get()
  return NextResponse.json({ id: doc.id, ...doc.data() })
}
