import { NextResponse } from 'next/server'
import { firestore } from '../../../../lib/firebaseAdmin'

// ── GET /api/sales/[id] ──────────────────────────────────────────────────────
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const doc = await firestore.collection('sales').doc(params.id).get()
  if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const itemsSnap = await doc.ref.collection('items').get()
  return NextResponse.json({
    id: doc.id,
    ...(doc.data() as any),
    items: itemsSnap.docs.map(i => ({ id: i.id, ...(i.data() as any) })),
  })
}

// ── PUT /api/sales/[id] ──────────────────────────────────────────────────────
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { customer, customerId, orderType, status, notes, items } = body

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'items array is required' }, { status: 422 })
  }

  const total = items.reduce((s: number, it: any) => s + (it.quantity ?? 0) * (it.price ?? 0), 0)
  const saleRef = firestore.collection('sales').doc(params.id)

  await firestore.runTransaction(async (tx) => {
    // Update the parent sale doc
    tx.update(saleRef, {
      ...(customer !== undefined && { customer }),
      ...(customerId !== undefined && { customerId: customerId || null }),
      ...(orderType !== undefined && { orderType }),
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes }),
      totalAmount: total,
      updatedAt: new Date().toISOString(),
    })

    // Delete all existing item sub-docs then re-create
    const existingItems = await saleRef.collection('items').get()
    existingItems.docs.forEach(d => tx.delete(d.ref))

    for (const it of items) {
      const itemRef = saleRef.collection('items').doc()
      tx.set(itemRef, {
        itemId: it.itemId || null,
        name: it.name || '',
        size: it.size || '',
        quantity: it.quantity,
        price: it.price,
      })
    }
  })

  const updated = await saleRef.get()
  const itemsSnap = await saleRef.collection('items').get()
  return NextResponse.json({
    id: saleRef.id,
    ...(updated.data() as any),
    items: itemsSnap.docs.map(i => ({ id: i.id, ...(i.data() as any) })),
  })
}

// ── DELETE /api/sales/[id] ───────────────────────────────────────────────────
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const saleRef = firestore.collection('sales').doc(params.id)

  // Delete items sub-collection first
  const itemsSnap = await saleRef.collection('items').get()
  const batch = firestore.batch()
  itemsSnap.docs.forEach(d => batch.delete(d.ref))
  batch.delete(saleRef)
  await batch.commit()

  return NextResponse.json({ success: true })
}
