import { NextResponse } from 'next/server'
import { firestore } from '../../../lib/firebaseAdmin'
import { SaleCreateSchema } from '../../../validations/sales'

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = SaleCreateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  const { customer, customerId, orderType, status, items, notes } = parsed.data

  const total = items.reduce((s: number, it: any) => s + it.quantity * it.price, 0)

  const saleRef = firestore.collection('sales').doc()
  const initialStatus = status || 'Pending'

  await firestore.runTransaction(async (tx) => {
    tx.set(saleRef, { invoiceNo: `INV-${Date.now()}`, customer, customerId: customerId || null, orderType: orderType || 'bag', status: initialStatus, totalAmount: total, notes, createdAt: new Date().toISOString() })

    for (const it of items) {
      const saleItemRef = saleRef.collection('items').doc()
      tx.set(saleItemRef, { 
        itemId: it.itemId || null, 
        name: it.name || '',
        size: it.size || '',
        material: it.material || '',
        quantity: it.quantity, 
        price: it.price 
      })

      if (it.itemId && initialStatus === 'Completed') {
        const invRef = firestore.collection('inventoryItems').doc(it.itemId)
        const invSnap = await tx.get(invRef)
        if (invSnap.exists) {
          const inv = invSnap.data() as any
          if ((inv.quantity ?? 0) >= it.quantity) {
            tx.update(invRef, { quantity: (inv.quantity ?? 0) - it.quantity })
            const histRef = firestore.collection('inventoryHistory').doc()
            tx.set(histRef, { itemId: it.itemId, change: -it.quantity, reason: `Sale ${saleRef.id}`, createdAt: new Date().toISOString() })
          }
        }
      }
    }
  })

  const saleDoc = await saleRef.get()
  return NextResponse.json({ id: saleRef.id, ...saleDoc.data() })
}

export async function GET() {
  const snap = await firestore.collection('sales').orderBy('createdAt', 'desc').get()
  const sales = await Promise.all(snap.docs.map(async d => {
    const itemsSnap = await d.ref.collection('items').get()
    return { id: d.id, ...(d.data() as any), items: itemsSnap.docs.map(i => ({ id: i.id, ...(i.data() as any) })) }
  }))
  return NextResponse.json(sales)
}
