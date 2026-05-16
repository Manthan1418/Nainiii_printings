import { NextRequest, NextResponse } from 'next/server'
import { firestore } from '../../../../lib/firebaseAdmin'

// ── GET /api/sales/[id] ──────────────────────────────────────────────────────
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const doc = await firestore.collection('sales').doc(id).get()
  if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const itemsSnap = await doc.ref.collection('items').get()
  return NextResponse.json({
    id: doc.id,
    ...(doc.data() as any),
    items: itemsSnap.docs.map(i => ({ id: i.id, ...(i.data() as any) })),
  })
}

// ── PUT /api/sales/[id] ──────────────────────────────────────────────────────
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const saleRef = firestore.collection('sales').doc(id)

  // Guard: block edits on paid orders
  const existing = await saleRef.get()
  if (!existing.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if ((existing.data() as any)?.status?.toLowerCase() === 'paid') {
    return NextResponse.json({ error: 'Cannot edit a paid order.' }, { status: 403 })
  }

  const body = await req.json()
  const { customer, customerId, orderType, status, notes, items, deliveryCharge, previousBalance, amountPaid } = body

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'items array is required' }, { status: 422 })
  }

  const itemsTotal = items.reduce((s: number, it: any) => s + (it.quantity ?? 0) * (it.price ?? 0), 0)
  const total = itemsTotal + (deliveryCharge || 0)
  const balanceDue = total + (previousBalance || 0) - (amountPaid || 0)

  await firestore.runTransaction(async (tx) => {
    tx.update(saleRef, {
      ...(customer !== undefined && { customer }),
      ...(customerId !== undefined && { customerId: customerId || null }),
      ...(orderType !== undefined && { orderType }),
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes }),
      ...(deliveryCharge !== undefined && { deliveryCharge: deliveryCharge || 0 }),
      ...(previousBalance !== undefined && { previousBalance: previousBalance || 0 }),
      ...(amountPaid !== undefined && { amountPaid: amountPaid || 0 }),
      totalAmount: total,
      balanceDue: Math.max(0, balanceDue),
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
        unit: it.unit || 'pcs',
        quantity: it.quantity,
        price: it.price,
      })
    }

    // Sync party outstanding balance
    const resolvedCustomerId = customerId ?? (existing.data() as any)?.customerId
    if (resolvedCustomerId) {
      const partyRef = firestore.collection('parties').doc(resolvedCustomerId)
      tx.update(partyRef, { outstandingBalance: Math.max(0, balanceDue) })
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
export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const saleRef = firestore.collection('sales').doc(id)

  // Guard: block deletes on paid orders
  const existing = await saleRef.get()
  if (!existing.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const data = existing.data() as any
  if (data?.status?.toLowerCase() === 'paid') {
    return NextResponse.json({ error: 'Cannot delete a paid order.' }, { status: 403 })
  }

  // Delete items sub-collection first
  const itemsSnap = await saleRef.collection('items').get()
  const batch = firestore.batch()
  itemsSnap.docs.forEach(d => batch.delete(d.ref))
  batch.delete(saleRef)
  await batch.commit()

  return NextResponse.json({ success: true })
}
