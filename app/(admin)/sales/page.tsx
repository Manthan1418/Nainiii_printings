"use client";
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

// ─── Item row type ────────────────────────────────────────────────────────────
type ItemRow = {
  id: number;           // local key only
  name: string;
  size: string;         // used for bag size; empty for printing
  quantity: number;
  price: number;
};

const blankItem = (id: number, orderType: 'bag' | 'printing'): ItemRow => ({
  id,
  name: '',
  size: orderType === 'bag' ? '' : '',
  quantity: 1,
  price: 0,
});

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderType, setOrderType] = useState<'bag' | 'printing'>('bag');
  const [items, setItems] = useState<ItemRow[]>([blankItem(1, 'bag')]);
  const [nextId, setNextId] = useState(2);
  const [itemErrors, setItemErrors] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  // Reset items when order type changes
  useEffect(() => {
    setItems([blankItem(1, orderType)]);
    setNextId(2);
    setItemErrors(null);
  }, [orderType]);

  useEffect(() => {
    if (isModalOpen && parties.length === 0) {
      fetch('/api/parties').then(r => r.json()).then(data => setParties(Array.isArray(data) ? data : [])).catch(console.error);
    }
  }, [isModalOpen, parties.length]);

  // ─── Item row helpers ───────────────────────────────────────────────────────
  const updateItem = (id: number, field: keyof Omit<ItemRow, 'id'>, value: string | number) => {
    setItems(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const addRow = () => {
    setItems(prev => [...prev, blankItem(nextId, orderType)]);
    setNextId(n => n + 1);
  };

  const removeRow = (id: number) => {
    setItems(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev);
  };

  // ─── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = async (data: any) => {
    // Validate all rows are filled
    const invalid = items.some(r => !r.name.trim() || r.quantity < 1 || r.price < 0);
    if (invalid) {
      setItemErrors('Please fill in all item rows completely.');
      return;
    }
    setItemErrors(null);

    try {
      const selectedParty = parties.find(p => p.id === data.customerId);
      const customerName = selectedParty ? selectedParty.name : data.customer;

      const payload = {
        customer: customerName,
        customerId: data.customerId || null,
        orderType,
        status: data.status || 'Pending',
        notes: data.notes,
        items: items.map(r => ({
          name: r.name,
          size: r.size || '',
          quantity: r.quantity,
          price: r.price,
        })),
      };

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());

      const updated = await fetch('/api/sales').then(r => r.json());
      setSales(Array.isArray(updated) ? updated : []);
      setIsModalOpen(false);
      reset();
      setItems([blankItem(1, orderType)]);
      setNextId(2);
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
      .then(data => { setSales(data); setLoading(false); })
      .catch(err => { console.error(err); setSales([]); setLoading(false); });
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

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  // ─── Inline total preview ────────────────────────────────────────────────────
  const orderTotal = items.reduce((acc, r) => acc + r.quantity * r.price, 0);

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
        <section className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden flex flex-col shadow-sm" style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)' }}>
          {/* Toolbar */}
          <div className="p-4 border-b border-outline-variant bg-surface flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-96">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">search</span>
              <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-DEFAULT bg-surface-container-lowest font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-tertiary-container focus:border-transparent transition-all" placeholder="Search orders by ID, Customer..." type="text" />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button className="flex items-center gap-2 px-3 py-2 border border-outline-variant rounded-DEFAULT bg-surface-container-lowest text-on-surface-variant font-body-sm text-body-sm hover:bg-surface-container-low w-full sm:w-auto justify-center">
                <span className="material-symbols-outlined text-[18px]">filter_list</span>Filter
              </button>
              <button className="flex items-center gap-2 px-3 py-2 border border-outline-variant rounded-DEFAULT bg-surface-container-lowest text-on-surface-variant font-body-sm text-body-sm hover:bg-surface-container-low w-full sm:w-auto justify-center">
                <span className="material-symbols-outlined text-[18px]">sort</span>Sort
              </button>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-zebra">
              <thead className="bg-surface-container text-on-surface-variant font-label-caps text-label-caps border-b border-outline-variant">
                <tr>
                  <th className="px-4 py-3 font-semibold w-12"><input className="rounded border-outline-variant text-tertiary-container focus:ring-tertiary-container" type="checkbox" /></th>
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
                      <td className="px-4 py-2 whitespace-nowrap"><input className="rounded border-outline-variant text-tertiary-container focus:ring-tertiary-container" type="checkbox" /></td>
                      <td className="px-4 py-2 whitespace-nowrap font-data-tabular text-data-tabular text-on-surface-variant">{sale.invoiceNo || sale.id}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-on-surface-variant">{sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : 'N/A'}</td>
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
              <button className="p-1 rounded text-on-surface-variant hover:bg-surface-container-high">
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* ── Create Order Modal ────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl w-full max-w-xl max-h-[92vh] flex flex-col">

            {/* Header */}
            <div className="p-6 border-b border-outline-variant flex justify-between items-center shrink-0">
              <h2 className="font-h2 text-h2 text-on-surface">Create New Order</h2>
              <button onClick={() => { setIsModalOpen(false); reset(); setItems([blankItem(1, orderType)]); setNextId(2); setItemErrors(null); }} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1">
              <form id="create-order-form" onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">

                {/* Customer */}
                <div>
                  <label className="block font-body-sm text-on-surface-variant mb-1">Customer *</label>
                  <select {...register('customerId', { required: true })} className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" required>
                    <option value="">-- Select Customer --</option>
                    {parties.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Order Type */}
                <div>
                  <label className="block font-body-sm text-on-surface-variant mb-1">Order Type</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setOrderType('bag')} className={`flex-1 py-2 rounded border text-body-sm font-semibold transition-all ${orderType === 'bag' ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'}`}>Bag Order</button>
                    <button type="button" onClick={() => setOrderType('printing')} className={`flex-1 py-2 rounded border text-body-sm font-semibold transition-all ${orderType === 'printing' ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'}`}>Printing Service</button>
                  </div>
                </div>

                {/* ── Items section ────────────────────────────────────────── */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-body-sm font-semibold text-on-surface">
                      {orderType === 'bag' ? 'Bag Products' : 'Printing Jobs'}
                    </label>
                    <span className="font-body-sm text-on-surface-variant">{items.length} row{items.length !== 1 ? 's' : ''}</span>
                  </div>

                  <div className="border border-outline-variant rounded-lg overflow-hidden">
                    {/* Column headers */}
                    <div className={`grid ${orderType === 'bag' ? 'grid-cols-[1fr_90px_80px_80px_36px]' : 'grid-cols-[1fr_80px_80px_36px]'} gap-0 bg-surface-container px-3 py-2 border-b border-outline-variant`}>
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider text-xs">
                        {orderType === 'bag' ? 'Product / Size' : 'Printing Type'}
                      </span>
                      {orderType === 'bag' && <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider text-xs text-center">Size</span>}
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider text-xs text-center">Qty</span>
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider text-xs text-center">Rate ₹</span>
                      <span />
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-outline-variant">
                      {items.map((row, idx) => (
                        <div key={row.id} className={`grid ${orderType === 'bag' ? 'grid-cols-[1fr_90px_80px_80px_36px]' : 'grid-cols-[1fr_80px_80px_36px]'} gap-0 items-center px-3 py-2`}>
                          {/* Name */}
                          <input
                            value={row.name}
                            onChange={e => updateItem(row.id, 'name', e.target.value)}
                            placeholder={orderType === 'bag' ? 'e.g. Non-Woven Bag' : 'e.g. Screen Print'}
                            className="w-full px-2 py-1.5 border border-outline-variant rounded text-body-sm text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-1 focus:ring-primary mr-1"
                            required
                          />
                          {/* Size (bags only) */}
                          {orderType === 'bag' && (
                            <input
                              value={row.size}
                              onChange={e => updateItem(row.id, 'size', e.target.value)}
                              placeholder="10x14"
                              className="w-full px-2 py-1.5 border border-outline-variant rounded text-body-sm text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-1 focus:ring-primary mx-1"
                              required
                            />
                          )}
                          {/* Quantity */}
                          <input
                            type="number"
                            min={1}
                            value={row.quantity}
                            onChange={e => updateItem(row.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full px-2 py-1.5 border border-outline-variant rounded text-body-sm text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-1 focus:ring-primary mx-1 text-center"
                          />
                          {/* Price */}
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={row.price}
                            onChange={e => updateItem(row.id, 'price', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 border border-outline-variant rounded text-body-sm text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-1 focus:ring-primary mx-1 text-right"
                          />
                          {/* Delete row */}
                          <button
                            type="button"
                            onClick={() => removeRow(row.id)}
                            disabled={items.length === 1}
                            className="ml-1 p-1 rounded text-on-surface-variant hover:text-error hover:bg-error-container disabled:opacity-30 transition-colors"
                            title="Remove row"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add row button */}
                    <button
                      type="button"
                      onClick={addRow}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 text-primary hover:bg-primary-container text-body-sm font-medium transition-colors border-t border-outline-variant"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      Add {orderType === 'bag' ? 'Product' : 'Job'}
                    </button>
                  </div>

                  {/* Validation error */}
                  {itemErrors && (
                    <p className="mt-1.5 text-error font-body-sm text-xs">{itemErrors}</p>
                  )}

                  {/* Live total */}
                  <div className="mt-2 flex justify-end">
                    <span className="font-body-sm text-on-surface-variant text-sm">
                      Order Total: <span className="font-semibold text-on-surface">{formatCurrency(orderTotal)}</span>
                    </span>
                  </div>
                </div>

                {/* Status */}
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

                {/* Notes */}
                <div>
                  <label className="block font-body-sm text-on-surface-variant mb-1">Notes</label>
                  <textarea {...register('notes')} className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" rows={2} />
                </div>

              </form>
            </div>

            {/* Footer actions — always visible */}
            <div className="p-6 border-t border-outline-variant shrink-0 flex justify-end gap-3 bg-surface-container-lowest rounded-b-xl">
              <button
                type="button"
                onClick={() => { setIsModalOpen(false); reset(); setItems([blankItem(1, orderType)]); setNextId(2); setItemErrors(null); }}
                className="px-4 py-2 border border-outline-variant rounded text-on-surface hover:bg-surface-container-low transition-colors font-body-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-order-form"
                disabled={isSubmitting}
                className="px-4 py-2 bg-primary text-on-primary rounded font-body-sm font-medium hover:bg-on-primary-fixed disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Creating...' : 'Create Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
