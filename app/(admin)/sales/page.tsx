"use client";
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderType, setOrderType] = useState<'bag' | 'printing'>('bag');
  
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  useEffect(() => {
    if (isModalOpen && parties.length === 0) {
      fetch('/api/parties').then(r => r.json()).then(data => setParties(Array.isArray(data) ? data : [])).catch(console.error);
    }
  }, [isModalOpen, parties.length]);

  const onSubmit = async (data: any) => {
    try {
      const selectedParty = parties.find(p => p.id === data.customerId);
      const customerName = selectedParty ? selectedParty.name : data.customer;
      
      const payload = {
        customer: customerName,
        customerId: data.customerId || null,
        orderType: orderType,
        status: data.status || 'Pending',
        notes: data.notes,
        items: [{
          name: data.productType || data.printingType,
          size: data.bagSize || data.printingSize,
          material: data.material || '',
          quantity: parseInt(data.quantity) || 1,
          price: parseFloat(data.price) || 0
        }]
      };

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
      
      const updated = await fetch('/api/sales').then(r => r.json());
      setSales(Array.isArray(updated) ? updated : []);
      setIsModalOpen(false);
      reset();
    } catch (err) {
      console.error(err);
      alert('Failed to create order');
    }
  };

  useEffect(() => {
    fetch('/api/sales')
      .then(async res => {
        if (!res.ok) throw new Error(await res.text() || res.statusText);
        return res.json();
      })
      .then(data => {
        setSales(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setSales([]);
        setLoading(false);
      });
  }, []);

  const filteredSales = sales.filter(s => 
    s.invoiceNo?.toLowerCase().includes(search.toLowerCase()) || 
    s.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.customer?.toLowerCase().includes(search.toLowerCase()) ||
    s.id?.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = sales.reduce((acc, sale) => acc + (sale.totalAmount || 0), 0);
  const pendingOrders = sales.filter(s => ['pending', 'processing'].includes(s.status?.toLowerCase())).length;
  const avgOrderValue = sales.length > 0 ? totalRevenue / sales.length : 0;

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  return (
    <div className="w-full h-full">
      
<div className="max-w-7xl mx-auto">
<header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
<div>
<h1 className="font-h1 text-h1 text-on-background mb-1">Sales &amp; Orders</h1>
<p className="font-body-md text-body-md text-on-surface-variant">Track, manage, and process recent transactions.</p>
</div>
<div className="flex items-center gap-3">
<button className="bg-surface-container-lowest text-on-surface border border-outline-variant font-body-md text-body-md px-4 py-2 rounded-DEFAULT hover:bg-surface-container-low transition-colors flex items-center gap-2">
<span className="material-symbols-outlined text-[18px]">download</span>
                        Export
                    </button>
<button onClick={() => setIsModalOpen(true)} className="bg-on-tertiary-fixed text-on-tertiary font-body-md text-body-md px-4 py-2 rounded-DEFAULT hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm">
<span className="material-symbols-outlined text-[18px]">add</span>
                        New Order
                    </button>
</div>
</header>
{/* Metrics Cards */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
<div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-lg flex flex-col justify-between h-[120px]">
<div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Total Revenue</div>
<div className="flex items-end justify-between">
<div className="font-h2 text-h2 text-on-background">{formatCurrency(totalRevenue)}</div>
<span className="material-symbols-outlined text-tertiary-container">trending_up</span>
</div>
</div>
<div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-lg flex flex-col justify-between h-[120px]">
<div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Orders Pending</div>
<div className="flex items-end justify-between">
<div className="font-h2 text-h2 text-on-background">{pendingOrders}</div>
<span className="material-symbols-outlined text-on-tertiary-container">pending_actions</span>
</div>
</div>
<div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-lg flex flex-col justify-between h-[120px]">
<div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Avg Order Value</div>
<div className="flex items-end justify-between">
<div className="font-h2 text-h2 text-on-background">{formatCurrency(avgOrderValue)}</div>
<span className="material-symbols-outlined text-outline">analytics</span>
</div>
</div>
</div>
{/* Table Section */}
<section className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden flex flex-col shadow-sm" style={{"boxShadow":"0 4px 6px -1px rgba(0,0,0,0.04)"}}>
{/* Toolbar */}
<div className="p-4 border-b border-outline-variant bg-surface flex flex-col sm:flex-row justify-between items-center gap-4">
<div className="relative w-full sm:w-96">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">search</span>
<input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-DEFAULT bg-surface-container-lowest font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-tertiary-container focus:border-transparent transition-all" placeholder="Search orders by ID, Customer..." type="text"/>
</div>
<div className="flex items-center gap-2 w-full sm:w-auto">
<button className="flex items-center gap-2 px-3 py-2 border border-outline-variant rounded-DEFAULT bg-surface-container-lowest text-on-surface-variant font-body-sm text-body-sm hover:bg-surface-container-low w-full sm:w-auto justify-center">
<span className="material-symbols-outlined text-[18px]">filter_list</span>
                            Filter
                        </button>
<button className="flex items-center gap-2 px-3 py-2 border border-outline-variant rounded-DEFAULT bg-surface-container-lowest text-on-surface-variant font-body-sm text-body-sm hover:bg-surface-container-low w-full sm:w-auto justify-center">
<span className="material-symbols-outlined text-[18px]">sort</span>
                            Sort
                        </button>
</div>
</div>
{/* Data Table */}
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse table-zebra">
<thead className="bg-surface-container text-on-surface-variant font-label-caps text-label-caps border-b border-outline-variant">
<tr>
<th className="px-4 py-3 font-semibold w-12">
<input className="rounded border-outline-variant text-tertiary-container focus:ring-tertiary-container" type="checkbox"/>
</th>
<th className="px-4 py-3 font-semibold uppercase tracking-wider">Order ID</th>
<th className="px-4 py-3 font-semibold uppercase tracking-wider">Date</th>
<th className="px-4 py-3 font-semibold uppercase tracking-wider">Customer</th>
<th className="px-4 py-3 font-semibold uppercase tracking-wider text-right">Total</th>
<th className="px-4 py-3 font-semibold uppercase tracking-wider">Status</th>
<th className="px-4 py-3 font-semibold uppercase tracking-wider text-right">Actions</th>
</tr>
</thead>
<tbody className="font-body-sm text-body-sm text-on-surface divide-y divide-outline-variant">
{loading ? (
  <tr><td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant">Loading sales data...</td></tr>
) : filteredSales.length === 0 ? (
  <tr><td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant">No sales found.</td></tr>
) : (
  filteredSales.map(sale => (
    <tr key={sale.id} className="hover:bg-surface-container-high transition-colors group">
      <td className="px-4 py-2 whitespace-nowrap">
        <input className="rounded border-outline-variant text-tertiary-container focus:ring-tertiary-container" type="checkbox"/>
      </td>
      <td className="px-4 py-2 whitespace-nowrap font-data-tabular text-data-tabular text-on-surface-variant">{sale.invoiceNo || sale.id}</td>
      <td className="px-4 py-2 whitespace-nowrap text-on-surface-variant">
        {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : 'N/A'}
      </td>
      <td className="px-4 py-2 whitespace-nowrap font-medium">{sale.customer?.name || sale.customer || 'Walk-in Customer'}</td>
      <td className="px-4 py-2 whitespace-nowrap text-right font-data-tabular text-data-tabular">{formatCurrency(sale.totalAmount || 0)}</td>
      <td className="px-4 py-2 whitespace-nowrap">
        {sale.status?.toLowerCase() === 'pending' || sale.status?.toLowerCase() === 'processing' ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full font-label-caps text-label-caps bg-tertiary-fixed text-on-tertiary-fixed capitalize">{sale.status}</span>
        ) : sale.status?.toLowerCase() === 'delayed' ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full font-label-caps text-label-caps bg-error-container text-on-error-container capitalize">{sale.status}</span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full font-label-caps text-label-caps bg-secondary-container text-on-secondary-container capitalize">{sale.status || 'Completed'}</span>
        )}
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-right">
        <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1 rounded text-primary hover:bg-primary-container transition-colors" title="Print Invoice" onClick={() => window.print()}>
            <span className="material-symbols-outlined text-[18px]">print</span>
          </button>
          <button className="p-1 rounded text-on-surface-variant hover:text-on-tertiary-fixed transition-colors">
            <span className="material-symbols-outlined text-[18px]">more_vert</span>
          </button>
        </div>
      </td>
    </tr>
  ))
)}
</tbody>
</table>
</div>
{/* Pagination */}
<div className="p-4 border-t border-outline-variant bg-surface flex items-center justify-between">
<span className="font-body-sm text-body-sm text-on-surface-variant">Showing {filteredSales.length} entries</span>
<div className="flex items-center gap-1">
<button className="p-1 rounded text-outline hover:bg-surface-container-high disabled:opacity-50" disabled>
<span className="material-symbols-outlined text-[20px]">chevron_left</span>
</button>
<button className="w-8 h-8 rounded bg-surface-container-highest text-on-surface font-body-sm text-body-sm flex items-center justify-center">1</button>
<button className="w-8 h-8 rounded text-on-surface-variant hover:bg-surface-container-high font-body-sm text-body-sm flex items-center justify-center">2</button>
<button className="w-8 h-8 rounded text-on-surface-variant hover:bg-surface-container-high font-body-sm text-body-sm flex items-center justify-center">3</button>
<span className="px-2 text-on-surface-variant">...</span>
<button className="p-1 rounded text-on-surface-variant hover:bg-surface-container-high">
<span className="material-symbols-outlined text-[20px]">chevron_right</span>
</button>
</div>
</div>
</section>
</div>

{/* Create Modal */}
{isModalOpen && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className="bg-surface-container-lowest rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
      <div className="p-6 border-b border-outline-variant flex justify-between items-center sticky top-0 bg-surface-container-lowest z-10">
        <h2 className="font-h2 text-h2 text-on-surface">Create New Order</h2>
        <button onClick={() => setIsModalOpen(false)} className="text-on-surface-variant hover:text-on-surface"><span className="material-symbols-outlined">close</span></button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
        <div>
          <label className="block font-body-sm text-on-surface-variant mb-1">Customer *</label>
          <select {...register('customerId', { required: true })} className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" required>
            <option value="">-- Select Customer --</option>
            {parties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-body-sm text-on-surface-variant mb-1">Order Type</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setOrderType('bag')} className={`flex-1 py-2 rounded border text-body-sm font-semibold transition-all ${orderType === 'bag' ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'}`}>Bag Order</button>
            <button type="button" onClick={() => setOrderType('printing')} className={`flex-1 py-2 rounded border text-body-sm font-semibold transition-all ${orderType === 'printing' ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'}`}>Printing Service</button>
          </div>
        </div>

        {orderType === 'bag' ? (
          <>
            <div>
              <label className="block font-body-sm text-on-surface-variant mb-1">Product Type *</label>
              <input {...register('productType', { required: true })} placeholder="e.g. Non-Woven Bag" className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>
            <div>
              <label className="block font-body-sm text-on-surface-variant mb-1">Bag Size *</label>
              <input {...register('bagSize', { required: true })} placeholder="e.g. 10x14" className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block font-body-sm text-on-surface-variant mb-1">Printing Type *</label>
              <input {...register('printingType', { required: true })} placeholder="e.g. Screen Print" className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>
            <div>
              <label className="block font-body-sm text-on-surface-variant mb-1">Material *</label>
              <input {...register('material', { required: true })} placeholder="e.g. Paper" className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>
            <div>
              <label className="block font-body-sm text-on-surface-variant mb-1">Printing Size *</label>
              <input {...register('printingSize', { required: true })} placeholder="e.g. A4" className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-body-sm text-on-surface-variant mb-1">Quantity (pcs) *</label>
            <input type="number" min="1" {...register('quantity', { required: true })} defaultValue="1" className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" required />
          </div>
          <div>
            <label className="block font-body-sm text-on-surface-variant mb-1">Rate per pcs (₹) *</label>
            <input type="number" step="0.01" min="0" {...register('price', { required: true })} defaultValue="0" className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" required />
          </div>
        </div>

        <div>
          <label className="block font-body-sm text-on-surface-variant mb-1">Order Status</label>
          <select {...register('status')} className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="Pending">Pending</option>
            <option value="In Production">In Production</option>
            <option value="Completed">Completed</option>
            <option value="Delivered">Delivered</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
        <div>
          <label className="block font-body-sm text-on-surface-variant mb-1">Notes</label>
          <textarea {...register('notes')} className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" rows={2}></textarea>
        </div>
        <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant mt-6">
          <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-outline-variant rounded text-on-surface hover:bg-surface-container-low transition-colors font-body-sm">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary text-on-primary rounded font-body-sm font-medium hover:bg-on-primary-fixed disabled:opacity-50 transition-colors">
            {isSubmitting ? 'Creating...' : 'Create Order'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

    </div>
  );
}
