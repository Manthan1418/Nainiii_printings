import { NextResponse } from 'next/server'
import { firestore } from '../../../lib/firebaseAdmin'

export async function GET() {
  try {
    const snap = await firestore.collection('production_batches').orderBy('createdAt', 'desc').get()
    const batches = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return NextResponse.json(batches)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { productType, productSize, quantity, producedQuantity, wasteQuantity, costPerPcs, notes, status } = body

    const totalCost = (producedQuantity || quantity) * (costPerPcs || 0)
    const initialStatus = status || 'Pending'
    
    const batchRef = firestore.collection('production_batches').doc()

    await firestore.runTransaction(async (tx) => {
      // 1. Create the production batch document
      tx.set(batchRef, {
        batchNo: `PRD-${Date.now()}`,
        productType,
        productSize,
        quantity: Number(quantity),
        producedQuantity: Number(producedQuantity) || 0,
        wasteQuantity: Number(wasteQuantity) || 0,
        costPerPcs: Number(costPerPcs) || 0,
        totalCost,
        notes: notes || '',
        status: initialStatus,
        createdAt: new Date().toISOString()
      })

      if (initialStatus === 'Completed') {
        // 2. Add Finished Good (if applicable)

        // 3. Add Finished Good
        // Try to find if this finished good exists in inventory by name/size. If not, maybe create?
        // Or if we require selecting an existing finished good.
        // Let's assume the body passes a `finishedGoodItemId` if it exists.
        if (body.finishedGoodItemId) {
          const fgRef = firestore.collection('inventoryItems').doc(body.finishedGoodItemId)
          const fgSnap = await tx.get(fgRef)
          if (fgSnap.exists) {
            const fgData = fgSnap.data() as any
            tx.update(fgRef, { quantity: (fgData.quantity ?? 0) + Number(producedQuantity) })
            const histRef = firestore.collection('inventoryHistory').doc()
            tx.set(histRef, { itemId: body.finishedGoodItemId, change: Number(producedQuantity), reason: `Production Batch ${batchRef.id}`, createdAt: new Date().toISOString() })
          }
        }

        // 4. Add to Expenses
        const expenseRef = firestore.collection('expenses').doc()
        tx.set(expenseRef, {
          expenseType: 'Production Cost',
          amount: totalCost,
          batchId: batchRef.id,
          notes: `Cost for Production Batch ${batchRef.id}`,
          date: new Date().toISOString()
        })
      }
    })

    const batchDoc = await batchRef.get()
    return NextResponse.json({ id: batchRef.id, ...batchDoc.data() }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
