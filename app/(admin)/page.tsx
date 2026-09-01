"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [sales, setSales] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [production, setProduction] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/sales').then(r => r.ok ? r.json() : []),
      fetch('/api/inventory').then(r => r.ok ? r.json() : []),
      fetch('/api/production').then(r => r.ok ? r.json() : []),
      fetch('/api/finance/receipts').then(r => r.ok ? r.json() : []),
      fetch('/api/finance/expenses').then(r => r.ok ? r.json() : [])
    ])
    .then(([salesData, inventoryData, prodData, recData, expData]) => {
      setSales(Array.isArray(salesData) ? salesData : []);
      setInventory(Array.isArray(inventoryData) ? inventoryData : []);
      setProduction(Array.isArray(prodData) ? prodData : []);
      setReceipts(Array.isArray(recData) ? recData : []);
      setExpenses(Array.isArray(expData) ? expData : []);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const totalRevenue = receipts.reduce((acc, rec) => acc + (Number(rec.amount) || 0), 0);
  const totalExpenses = expenses.reduce((acc, exp) => acc + (Number(exp.amount) || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const activeOrders = sales.filter(s => ['pending', 'in production'].includes(s.status?.toLowerCase())).length;
  const inventoryAlerts = inventory.filter(i => (i.quantity ?? 0) <= (i.reorderLevel ?? 10)).length;

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  // Merge recent activity
  const recentSales = sales.map(s => ({ ...s, type: 'Sale', dateStr: s.createdAt }));
  const recentProd = production.map(p => ({ ...p, type: 'Production', dateStr: p.createdAt }));
  const recentActivity = [...recentSales, ...recentProd]
    .sort((a, b) => new Date(b.dateStr || 0).getTime() - new Date(a.dateStr || 0).getTime())
    .slice(0, 5);

  return (
    <main className="flex-1 md:ml-sidebar-width p-container-padding overflow-y-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="font-h1 text-h1 text-primary">Material Flow Dashboard</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">Track raw materials from purchase → production → delivery to customers.</p>
        </div>
        <div className="hidden sm:flex gap-3">
          <Link href="/sales" className="bg-tertiary-container text-on-tertiary rounded-DEFAULT px-4 py-2 font-body-md hover:bg-on-tertiary-fixed-variant transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">add</span> New Order
          </Link>
        </div>
      </div>

{/* Metrics Grid */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
{/* Metric Card 1 */}
<div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 ambient-shadow flex flex-col justify-between">
<div className="flex justify-between items-start mb-4">
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Total Revenue</span>
<span className="material-symbols-outlined text-outline">payments</span>
</div>
<div>
<div className="font-h2 text-h2 text-primary mb-1">{loading ? '...' : formatCurrency(totalRevenue)}</div>
<div className="flex items-center gap-1 text-on-tertiary-container text-body-sm">
<span className="material-symbols-outlined text-[16px]">trending_up</span>
<span>Money received</span>
</div>
</div>
</div>
{/* Metric Card 2 */}
<div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 ambient-shadow flex flex-col justify-between">
<div className="flex justify-between items-start mb-4">
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Production Cost</span>
<span className="material-symbols-outlined text-outline">precision_manufacturing</span>
</div>
<div>
<div className="font-h2 text-h2 text-primary mb-1">{loading ? '...' : formatCurrency(totalExpenses)}</div>
<div className="flex items-center gap-1 text-on-surface-variant text-body-sm">
<span className="material-symbols-outlined text-[16px] text-outline">trending_down</span>
<span>Money spent</span>
</div>
</div>
</div>
{/* Metric Card 3 */}
<div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 ambient-shadow flex flex-col justify-between">
<div className="flex justify-between items-start mb-4">
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Material Alerts</span>
<span className="material-symbols-outlined text-error">warning</span>
</div>
<div>
<div className="font-h2 text-h2 text-error mb-1">{loading ? '...' : `${inventoryAlerts}`}</div>
<div className="flex items-center gap-1 text-error text-body-sm">
<span className="material-symbols-outlined text-[16px]">arrow_downward</span>
<span>Running low on materials</span>
</div>
</div>
</div>
</div>
{/* Bento Grid Layout for Main Content */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
{/* Recent Activity Feed (Takes up 2 columns on large screens) */}
<div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl ambient-shadow overflow-hidden flex flex-col">
<div className="px-6 py-4 border-b border-surface-variant flex justify-between items-center bg-surface-bright">
<h3 className="font-h3 text-h3 text-primary">Recent Activity</h3>
<button className="text-on-surface-variant hover:text-primary transition-colors">
<span className="material-symbols-outlined">filter_list</span>
</button>
</div>
<div className="flex-1 overflow-y-auto p-0">
<table className="w-full text-left border-collapse">
<thead className="bg-surface-container-low font-data-tabular text-data-tabular text-on-surface-variant border-b border-surface-variant">
<tr>
<th className="py-3 px-6 font-medium">Time</th>
<th className="py-3 px-6 font-medium">User</th>
<th className="py-3 px-6 font-medium">Action</th>
<th className="py-3 px-6 font-medium text-right">Status</th>
</tr>
</thead>
<tbody className="font-body-sm text-body-sm text-on-surface divide-y divide-surface-variant">
{loading ? (
  <tr><td colSpan={4} className="py-8 text-center text-on-surface-variant">Loading...</td></tr>
) : recentActivity.length === 0 ? (
  <tr><td colSpan={4} className="py-8 text-center text-on-surface-variant">No recent activity.</td></tr>
) : (
  recentActivity.map((activity, idx) => (
    <tr key={activity.id} className={`hover:bg-surface-container-low transition-colors group ${idx % 2 === 1 ? 'bg-surface' : ''}`}>
      <td className="py-3 px-6 font-data-tabular text-on-surface-variant">
        {activity.dateStr ? new Date(activity.dateStr).toLocaleDateString() : 'N/A'}
      </td>
      <td className="py-3 px-6 flex items-center gap-2">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${activity.type === 'Sale' ? 'bg-secondary-container text-on-secondary-container' : 'bg-tertiary-container text-on-tertiary-container'}`}>
          {activity.type === 'Sale' ? 'S' : 'P'}
        </div>
        <span>{activity.type === 'Sale' ? activity.customer || 'Customer' : 'Internal'}</span>
      </td>
      <td className="py-3 px-6">{activity.type === 'Sale' ? `Order ${activity.invoiceNo}` : `Batch ${activity.batchNo}`}</td>
      <td className="py-3 px-6 text-right">
        <span className="inline-block px-2 py-1 bg-surface-container-high text-on-surface rounded-DEFAULT text-[10px] font-bold uppercase tracking-wider">
          {activity.status || 'Complete'}
        </span>
      </td>
    </tr>
  ))
)}
</tbody>
</table>
</div>
</div>
{/* Quick Actions & System Status */}
<div className="flex flex-col gap-6">
{/* Quick Actions */}
<div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 ambient-shadow">
<h3 className="font-h3 text-h3 text-primary mb-4">Quick Actions</h3>
<div className="grid grid-cols-2 gap-3">
<Link href="/inventory" className="flex flex-col items-center justify-center p-4 bg-surface rounded-lg border border-surface-variant hover:border-outline-variant hover:bg-surface-container-low transition-all">
<span className="material-symbols-outlined text-primary mb-2">shopping_cart</span>
<span className="font-body-sm text-body-sm text-on-surface text-center">Add Materials</span>
</Link>
<Link href="/production" className="flex flex-col items-center justify-center p-4 bg-surface rounded-lg border border-surface-variant hover:border-outline-variant hover:bg-surface-container-low transition-all">
<span className="material-symbols-outlined text-primary mb-2">precision_manufacturing</span>
<span className="font-body-sm text-body-sm text-on-surface text-center">Create Batch</span>
</Link>
<Link href="/sales" className="flex flex-col items-center justify-center p-4 bg-surface rounded-lg border border-surface-variant hover:border-outline-variant hover:bg-surface-container-low transition-all">
<span className="material-symbols-outlined text-primary mb-2">local_shipping</span>
<span className="font-body-sm text-body-sm text-on-surface text-center">New Order</span>
</Link>
<Link href="/parties" className="flex flex-col items-center justify-center p-4 bg-surface rounded-lg border border-surface-variant hover:border-outline-variant hover:bg-surface-container-low transition-all">
<span className="material-symbols-outlined text-primary mb-2">person_add</span>
<span className="font-body-sm text-body-sm text-on-surface text-center">New Customer</span>
</Link>
</div>
</div>
{/* System Status Minimal */}
<div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 ambient-shadow flex-1">
<h3 className="font-h3 text-h3 text-primary mb-4">Business Summary</h3>
<ul className="flex flex-col gap-4">
<li className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[18px] text-on-surface-variant">account_balance_wallet</span>
<span className="font-body-sm text-body-sm text-on-surface">Net Profit</span>
</div>
<span className={`font-data-tabular text-data-tabular ${netProfit >= 0 ? 'text-primary' : 'text-error'}`}>{formatCurrency(netProfit)}</span>
</li>
<li className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[18px] text-on-surface-variant">precision_manufacturing</span>
<span className="font-body-sm text-body-sm text-on-surface">Production Batches</span>
</div>
<span className="font-data-tabular text-data-tabular text-on-surface-variant">{production.length}</span>
</li>
<li className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[18px] text-error">warning</span>
<span className="font-body-sm text-body-sm text-on-surface">Low Stock Items</span>
</div>
<span className="font-data-tabular text-data-tabular text-error">{inventoryAlerts}</span>
</li>
</ul>
</div>
</div>
</div>
</main>
  );
}
