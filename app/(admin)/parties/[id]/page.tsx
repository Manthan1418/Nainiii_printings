"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

interface Party {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  type: string;
  gstin: string;
  notes: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

export default function PartyProfile() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [party, setParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const partyRes = await fetch(`/api/parties/${id}`);
        if (!partyRes.ok) {
          router.push('/parties');
          return;
        }
        const p = await partyRes.json();
        setParty(p);

        // Ideally we fetch orders/receipts filtered by customerId in the backend
        // But for now, we fetch all and filter client side
        const [salesRes, receiptsRes] = await Promise.all([
          fetch('/api/sales'),
          fetch('/api/finance/receipts')
        ]);
        
        const allSales = await salesRes.json();
        const allReceipts = await receiptsRes.json();

        // Customer could be linked by ID or name depending on old structure vs new
        setOrders(allSales.filter((s: any) => s.customerId === id || s.customer === p.name || s.customer?.name === p.name));
        setReceipts(allReceipts.filter((r: any) => r.customerId === id || r.customer === p.name));
      } catch (err) {
        console.error("Failed to load profile data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, router]);

  if (loading) {
    return <div className="p-8 text-center"><span className="material-symbols-outlined animate-spin text-[32px]">progress_activity</span></div>;
  }

  if (!party) return null;

  const totalOrderAmount = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalPaidAmount = receipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const outstandingBalance = totalOrderAmount - totalPaidAmount;

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  return (
    <main className="flex-1 md:ml-sidebar-width p-container-padding overflow-y-auto">
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => router.push('/parties')} className="p-2 rounded-full hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="font-h2 text-h2 text-primary">{party.name}</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant capitalize">{party.type}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface-container-lowest border border-outline-variant p-5 rounded-xl shadow-sm">
          <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider mb-2">Total Order Amount</h3>
          <div className="font-h2 text-h2 text-on-surface">{formatCurrency(totalOrderAmount)}</div>
          <p className="text-[12px] text-on-surface-variant mt-1">{orders.length} total orders</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant p-5 rounded-xl shadow-sm">
          <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider mb-2">Total Paid</h3>
          <div className="font-h2 text-h2 text-on-surface">{formatCurrency(totalPaidAmount)}</div>
          <p className="text-[12px] text-on-surface-variant mt-1">{receipts.length} total payments</p>
        </div>
        <div className={`border p-5 rounded-xl shadow-sm ${outstandingBalance > 0 ? 'bg-error-container border-error text-on-error-container' : 'bg-surface-container-lowest border-outline-variant'}`}>
          <h3 className="font-label-caps text-label-caps uppercase tracking-wider mb-2 opacity-80">Outstanding Balance</h3>
          <div className="font-h2 text-h2">{formatCurrency(outstandingBalance)}</div>
          <p className="text-[12px] mt-1 opacity-80">Pending dues</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Details */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-variant bg-surface-bright">
            <h3 className="font-h3 text-h3 text-primary">Details</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-outline">call</span>
              <span className="text-body-md">{party.phone || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-outline">mail</span>
              <span className="text-body-md">{party.email || 'N/A'}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-outline">location_on</span>
              <div>
                <span className="text-body-md block">{party.address || 'N/A'}</span>
                {party.latitude && party.longitude && (
                   <a href={`https://www.google.com/maps/search/?api=1&query=${party.latitude},${party.longitude}`} target="_blank" rel="noopener noreferrer" className="text-primary text-[12px] hover:underline mt-1 inline-block">
                     View on Maps
                   </a>
                )}
              </div>
            </div>
            {party.gstin && (
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-outline">receipt</span>
                <span className="text-body-md font-mono">GSTIN: {party.gstin}</span>
              </div>
            )}
            {party.notes && (
              <div className="flex items-start gap-3 pt-2 border-t border-surface-variant">
                <span className="material-symbols-outlined text-outline">notes</span>
                <span className="text-body-sm text-on-surface-variant italic">{party.notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Order History */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-variant bg-surface-bright flex justify-between items-center">
            <h3 className="font-h3 text-h3 text-primary">Recent Orders</h3>
            <Link href="/sales" className="text-primary text-body-sm hover:underline">View All</Link>
          </div>
          <div className="p-0">
            {orders.length === 0 ? (
              <div className="p-6 text-center text-on-surface-variant">No orders yet.</div>
            ) : (
              <div className="divide-y divide-surface-variant max-h-[300px] overflow-y-auto">
                {orders.map(o => (
                  <div key={o.id} className="p-4 flex justify-between items-center hover:bg-surface-container-low">
                    <div>
                      <div className="font-medium text-on-surface">{o.invoiceNo || o.id.substring(0,6)}</div>
                      <div className="text-[12px] text-on-surface-variant">{new Date(o.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-data-tabular">{formatCurrency(o.totalAmount || 0)}</div>
                      <div className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container inline-block mt-1">
                        {o.status || 'Completed'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden lg:col-span-2">
          <div className="px-6 py-4 border-b border-surface-variant bg-surface-bright flex justify-between items-center">
            <h3 className="font-h3 text-h3 text-primary">Payment History</h3>
            <button className="text-primary text-body-sm hover:underline" onClick={() => router.push('/finance')}>Add Payment</button>
          </div>
          <div className="p-0">
            {receipts.length === 0 ? (
              <div className="p-6 text-center text-on-surface-variant">No payments recorded.</div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-surface-container-low text-on-surface-variant border-b border-surface-variant text-[12px] uppercase">
                  <tr>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Method</th>
                    <th className="px-6 py-3 font-medium">Notes</th>
                    <th className="px-6 py-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant text-body-sm">
                  {receipts.map(r => (
                    <tr key={r.id} className="hover:bg-surface-container-low">
                      <td className="px-6 py-3">{new Date(r.date || r.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-3 capitalize">{r.method || 'Cash'}</td>
                      <td className="px-6 py-3 text-on-surface-variant">{r.notes || '—'}</td>
                      <td className="px-6 py-3 text-right font-medium text-primary">{formatCurrency(Number(r.amount) || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
