import { NextResponse } from 'next/server'
import { firestore } from '../../../../lib/firebaseAdmin'

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await firestore.collection('parties').doc(params.id).delete()
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
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
      updatedAt: new Date().toISOString(),
    }

    await firestore.collection('parties').doc(params.id).update(data)
    return NextResponse.json({ id: params.id, ...data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
