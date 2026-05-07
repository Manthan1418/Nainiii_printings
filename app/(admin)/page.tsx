"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [sales, setSales] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/sales').then(async res => {
        if (!res.ok) throw new Error(await res.text() || res.statusText);
        return res.json();
      }),
      fetch('/api/inventory').then(async res => {
        if (!res.ok) throw new Error(await res.text() || res.statusText);
        return res.json();
      })
    ])
    .then(([salesData, inventoryData]) => {
      setSales(Array.isArray(salesData) ? salesData : []);
      setInventory(Array.isArray(inventoryData) ? inventoryData : []);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const totalRevenue = sales.reduce((acc, sale) => acc + (sale.totalAmount || 0), 0);
  const activeOrders = sales.filter(s => ['pending', 'processing'].includes(s.status?.toLowerCase())).length;
  const inventoryAlerts = inventory.filter(i => (i.quantity ?? 0) < 10).length;

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  const recentActivity = [...sales].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 4);
  return (
    <main className="flex-1 md:ml-sidebar-width p-container-padding overflow-y-auto">
<div className="mb-8 flex justify-between items-end">
<div>
<h1 className="font-h1 text-h1 text-primary">Executive Overview</h1>
<p className="font-body-lg text-body-lg text-on-surface-variant mt-1">Real-time enterprise metrics and recent activity.</p>
</div>
<div className="hidden sm:flex gap-3">
<button className="bg-surface-container-lowest text-primary border border-outline-variant rounded-DEFAULT px-4 py-2 font-body-md hover:bg-surface-container-low transition-colors">Export Report</button>
<button className="bg-tertiary-container text-on-tertiary rounded-DEFAULT px-4 py-2 font-body-md hover:bg-on-tertiary-fixed-variant transition-colors flex items-center gap-2">
<span className="material-symbols-outlined text-[18px]">add</span> New Entry
                    </button>
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
<span>Live data</span>
</div>
</div>
</div>
{/* Metric Card 2 */}
<div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 ambient-shadow flex flex-col justify-between">
<div className="flex justify-between items-start mb-4">
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Active Orders</span>
<span className="material-symbols-outlined text-outline">local_shipping</span>
</div>
<div>
<div className="font-h2 text-h2 text-primary mb-1">{loading ? '...' : activeOrders}</div>
<div className="flex items-center gap-1 text-on-surface-variant text-body-sm">
<span className="material-symbols-outlined text-[16px] text-outline">pending_actions</span>
<span>Pending or Processing</span>
</div>
</div>
</div>
{/* Metric Card 3 */}
<div className="bg-surface-container-lowest border border-error-container rounded-xl p-4 ambient-shadow flex flex-col justify-between">
<div className="flex justify-between items-start mb-4">
<span className="font-label-caps text-label-caps text-error uppercase tracking-wider">Inventory Alerts</span>
<span className="material-symbols-outlined text-error">warning</span>
</div>
<div>
<div className="font-h2 text-h2 text-error mb-1">{loading ? '...' : `${inventoryAlerts} Items`}</div>
<div className="flex items-center gap-1 text-error text-body-sm">
<span className="material-symbols-outlined text-[16px]">arrow_downward</span>
<span>Below critical threshold</span>
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
        {activity.createdAt ? new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
      </td>
      <td className="py-3 px-6 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-[10px] font-bold">
          {(activity.customer?.name?.[0] || activity.customer?.[0] || 'C').toUpperCase()}
        </div>
        <span>{activity.customer?.name || activity.customer || 'Customer'}</span>
      </td>
      <td className="py-3 px-6">Placed Order {activity.invoiceNo || activity.id?.substring(0,6)}</td>
      <td className="py-3 px-6 text-right">
        <span className="inline-block px-2 py-1 bg-secondary-container text-on-secondary-container rounded-DEFAULT text-[10px] font-bold uppercase tracking-wider">
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
<button className="flex flex-col items-center justify-center p-4 bg-surface rounded-lg border border-surface-variant hover:border-outline-variant hover:bg-surface-container-low transition-all">
<span className="material-symbols-outlined text-primary mb-2">add_shopping_cart</span>
<span className="font-body-sm text-body-sm text-on-surface">New Order</span>
</button>
<button className="flex flex-col items-center justify-center p-4 bg-surface rounded-lg border border-surface-variant hover:border-outline-variant hover:bg-surface-container-low transition-all">
<span className="material-symbols-outlined text-primary mb-2">person_add</span>
<span className="font-body-sm text-body-sm text-on-surface">Add User</span>
</button>
<button className="flex flex-col items-center justify-center p-4 bg-surface rounded-lg border border-surface-variant hover:border-outline-variant hover:bg-surface-container-low transition-all">
<span className="material-symbols-outlined text-primary mb-2">receipt_long</span>
<span className="font-body-sm text-body-sm text-on-surface">Create Invoice</span>
</button>
<button className="flex flex-col items-center justify-center p-4 bg-surface rounded-lg border border-surface-variant hover:border-outline-variant hover:bg-surface-container-low transition-all">
<span className="material-symbols-outlined text-primary mb-2">support_agent</span>
<span className="font-body-sm text-body-sm text-on-surface">Support Tkt</span>
</button>
</div>
</div>
{/* System Status Minimal */}
<div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 ambient-shadow flex-1">
<h3 className="font-h3 text-h3 text-primary mb-4">System Status</h3>
<ul className="flex flex-col gap-4">
<li className="flex items-center justify-between">
<div className="flex items-center gap-2">
<div className="w-2 h-2 rounded-full bg-on-tertiary-container"></div>
<span className="font-body-sm text-body-sm text-on-surface">Main Database</span>
</div>
<span className="font-data-tabular text-data-tabular text-on-surface-variant">99.9% Uptime</span>
</li>
<li className="flex items-center justify-between">
<div className="flex items-center gap-2">
<div className="w-2 h-2 rounded-full bg-on-tertiary-container"></div>
<span className="font-body-sm text-body-sm text-on-surface">Payment Gateway</span>
</div>
<span className="font-data-tabular text-data-tabular text-on-surface-variant">Operational</span>
</li>
<li className="flex items-center justify-between">
<div className="flex items-center gap-2">
<div className="w-2 h-2 rounded-full bg-error"></div>
<span className="font-body-sm text-body-sm text-on-surface">Legacy Sync</span>
</div>
<span className="font-data-tabular text-data-tabular text-error">Failing</span>
</li>
</ul>
</div>
</div>
</div>
</main>
  );
}
