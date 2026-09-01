import { NextResponse } from 'next/server'
import { firestore } from '../../../lib/firebaseAdmin'

export const runtime = 'nodejs'

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
    const { finishedProductId, rawMaterials, producedQuantity, wasteQuantity, costPerPcs, notes, status } = body
    // rawMaterials: [{ itemId, quantity }, ...]

    const totalCost = (producedQuantity || 0) * (costPerPcs || 0)
    const initialStatus = status || 'Pending'
    
    const batchRef = firestore.collection('production_batches').doc()

    await firestore.runTransaction(async (tx) => {
      // 1. Create the production batch document
      tx.set(batchRef, {
        batchNo: `PRD-${Date.now()}`,
        finishedProductId: finishedProductId || '',
        rawMaterials: rawMaterials || [],
        producedQuantity: Number(producedQuantity) || 0,
        wasteQuantity: Number(wasteQuantity) || 0,
        costPerPcs: Number(costPerPcs) || 0,
        totalCost,
        notes: notes || '',
        status: initialStatus,
        createdAt: new Date().toISOString()
      })

      if (initialStatus === 'Completed') {
        // 2. Consume raw materials
        if (Array.isArray(rawMaterials) && rawMaterials.length > 0) {
          for (const rm of rawMaterials) {
            const rmRef = firestore.collection('inventoryItems').doc(rm.itemId)
            const rmSnap = await tx.get(rmRef)
            if (rmSnap.exists) {
              const rmData = rmSnap.data() as any
              const newQty = Math.max(0, (rmData.quantity ?? 0) - Number(rm.quantity))
              tx.update(rmRef, { quantity: newQty })
              const histRef = firestore.collection('inventoryHistory').doc()
              tx.set(histRef, { itemId: rm.itemId, change: -Number(rm.quantity), reason: `Consumed in Production Batch ${batchRef.id}`, createdAt: new Date().toISOString() })
            }
          }
        }

        // 3. Add/Update Finished Product
        if (finishedProductId) {
          const fgRef = firestore.collection('inventoryItems').doc(finishedProductId)
          const fgSnap = await tx.get(fgRef)
          if (fgSnap.exists) {
            const fgData = fgSnap.data() as any
            tx.update(fgRef, { quantity: (fgData.quantity ?? 0) + Number(producedQuantity) })
            const histRef = firestore.collection('inventoryHistory').doc()
            tx.set(histRef, { itemId: finishedProductId, change: Number(producedQuantity), reason: `Produced in Batch ${batchRef.id}`, createdAt: new Date().toISOString() })
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
