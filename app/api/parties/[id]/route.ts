import { NextRequest, NextResponse } from 'next/server'
import { firestore } from '../../../../lib/firebaseAdmin'

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    await firestore.collection('parties').doc(id).delete()
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
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
      type: type || 'customer',
      gstin: gstin?.trim() || '',
      notes: notes?.trim() || '',
      latitude: body.latitude,
      longitude: body.longitude,
      updatedAt: new Date().toISOString(),
    }

    await firestore.collection('parties').doc(id).update(data)
    return NextResponse.json({ id, ...data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const doc = await firestore.collection('parties').doc(id).get()
    if (!doc.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const data = doc.data() as any
    return NextResponse.json({
      id: doc.id,
      ...data,
      outstandingBalance: data.outstandingBalance ?? 0,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
