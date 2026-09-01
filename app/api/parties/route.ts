import { NextResponse } from 'next/server'
import { firestore } from '../../../lib/firebaseAdmin'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const snap = await firestore.collection('parties').orderBy('createdAt', 'desc').get()
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return NextResponse.json(items)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, phone, email, address, type, gstin, notes } = body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Party name is required' }, { status: 422 })
    }

    const data = {
      name: name.trim(),
      phone: phone?.trim() || '',
      email: email?.trim() || '',
      address: address?.trim() || '',
      type: type || 'customer',   // 'customer' | 'supplier' | 'both'
      gstin: gstin?.trim() || '',
      notes: notes?.trim() || '',
      latitude: body.latitude,
      longitude: body.longitude,
      createdAt: new Date().toISOString(),
    }

    const docRef = await firestore.collection('parties').add(data)
    return NextResponse.json({ id: docRef.id, ...data }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
