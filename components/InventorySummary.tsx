import React from 'react'
import { firestore } from '../lib/firebaseAdmin'

export default async function InventorySummary() {
  const itemsSnap = await firestore.collection('inventoryItems').get()
  const totalItems = itemsSnap.size
  let totalQuantity = 0
  let lowStock = 0
  itemsSnap.forEach(doc => {
    const data = doc.data()
    const qty = data.quantity ?? 0
    totalQuantity += qty
    if (qty < 5) lowStock += 1
  })

  return (
    <div className="space-y-2">
      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
        <h3 className="text-sm text-gray-500">Total Items</h3>
        <p className="text-xl font-bold">{totalItems}</p>
      </div>
      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
        <h3 className="text-sm text-gray-500">Total Quantity</h3>
        <p className="text-xl font-bold">{totalQuantity}</p>
      </div>
      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
        <h3 className="text-sm text-gray-500">Low Stock Items</h3>
        <p className="text-xl font-bold">{lowStock}</p>
      </div>
    </div>
  )
}
