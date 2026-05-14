import { NextResponse } from 'next/server'
import { firestore } from '../../../../lib/firebaseAdmin'

export async function GET() {
  try {
    const snap = await firestore.collection('expenses').orderBy('date', 'desc').get()
    const expenses = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return NextResponse.json(expenses)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const docRef = await firestore.collection('expenses').add({ 
      ...body, 
      date: body.date ?? new Date().toISOString() 
    })
    const doc = await docRef.get()
    return NextResponse.json({ id: doc.id, ...doc.data() }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
