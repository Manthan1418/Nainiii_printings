import { NextResponse } from 'next/server'
import { firestore } from '../../../../lib/firebaseAdmin'

export async function PATCH(
  req: Request,
  context: any
) {
  const params = await context.params;
  try {
    const body = await req.json()
    const data = {
      ...body,
      quantity: Number(body.quantity) || 0,
      buyingPrice: Number(body.buyingPrice) || 0,
      sellingPrice: Number(body.sellingPrice) || 0,
      reorderLevel: Number(body.reorderLevel) || 0,
      updatedAt: new Date().toISOString(),
    }
    await firestore.collection('inventoryItems').doc(params.id).update(data)
    return NextResponse.json({ id: params.id, ...data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  context: any
) {
  const params = await context.params;
  try {
    await firestore.collection('inventoryItems').doc(params.id).delete()
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
