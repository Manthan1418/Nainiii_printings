"use client";
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '../../../components/Toast';
import { printInvoice } from '../../../components/PrintInvoice';

// ─── Item row type ────────────────────────────────────────────────────────────
type ItemRow = {
  id: number;           // local key only
  name: string;
  productId?: string;   // reference to inventory item
  unit: string;         // e.g. pcs, kg, m
  quantity: number;
  price: number;
  maxQuantity?: number; // max available stock
};

const blankItem = (id: number): ItemRow => ({
  id,
  name: '',
  unit: 'pcs',
  quantity: 1,
  price: 0,
});

export default function SalesPage() {
  const { success, error: toastError, warning } = useToast();
  const [sales, setSales] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<any | null>(null);
  const [orderType, setOrderType] = useState<'bag' | 'printing'>('bag');
  const [items, setItems] = useState<ItemRow[]>([blankItem(1)]);
  const [nextId, setNextId] = useState(2);
  const [itemErrors, setItemErrors] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deliveryCharge, setDeliveryCharge] = useState<number>(0);
  const [previousBalance, setPreviousBalance] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [fetchingBalance, setFetchingBalance] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm();

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSale(null);
    reset();
    setItems([blankItem(1)]);
    setNextId(2);
    setItemErrors(null);
    setDeliveryCharge(0);
    setPreviousBalance(0);
    setAmountPaid(0);
  };

  const fetchPartyBalance = async (partyId: string) => {
    if (!partyId) { setPreviousBalance(0); return; }
    setFetchingBalance(true);
    try {
      const res = await fetch(`/api/parties/${partyId}`);
      if (res.ok) {
        const party = await res.json();
        setPreviousBalance(party.outstandingBalance || 0);
      }
    } catch { /* silently ignore */ }
    finally { setFetchingBalance(false); }
  };

  const openEdit = async (sale: any) => {
    try {
      const [saleRes, partiesRes, inventoryRes] = await Promise.all([
        fetch(`/api/sales/${sale.id}`),
        fetch('/api/parties'),
        fetch('/api/inventory'),
      ]);

      const saleDetails = saleRes.ok ? await saleRes.json() : sale;
      const partyList = partiesRes.ok ? await partiesRes.json() : parties;
      const inventoryData = inventoryRes.ok ? await inventoryRes.json() : inventory;

      const allInventory = Array.isArray(inventoryData) ? inventoryData : [];
      const sellableItems = allInventory.filter((item: any) => !item.soldAt && (item.quantity ?? 0) > 0);

      const selectedItems = (saleDetails.items || []).map((it: any) => {
        const linked = allInventory.find((inv: any) => inv.id === it.itemId || inv.id === it.productId);
        const byName = linked || allInventory.find((inv: any) =>
          (inv.name || '').trim().toLowerCase() === (it.name || '').trim().toLowerCase()
        );
        return {
          id: byName?.id || it.itemId || it.productId,
          name: it.name || byName?.name || '',
          quantity: byName?.quantity ?? it.quantity ?? 0,
          unit: it.unit || byName?.unit || 'pcs',
          sellingPrice: it.price ?? byName?.sellingPrice ?? 0,
          soldAt: 'edit-only',
        };
      }).filter((it: any) => it.id);

      const inventoryForEdit = [...sellableItems];
      for (const item of selectedItems) {
        if (!inventoryForEdit.some((existing: any) => existing.id === item.id)) {
          inventoryForEdit.push(item);
        }
      }

      const normalizedParties = Array.isArray(partyList) ? partyList : [];
      setParties(normalizedParties);
      setInventory(inventoryForEdit);

      const customerName = (saleDetails.customer?.name || saleDetails.customer || '').toString().trim().toLowerCase();
      const matchedParty = normalizedParties.find((p: any) => (p.name || '').toString().trim().toLowerCase() === customerName);
      const resolvedCustomerId = saleDetails.customerId || matchedParty?.id || '';

      const rows: ItemRow[] = (saleDetails.items || []).map((it: any, i: number) => {
        const linked = inventoryForEdit.find((inv: any) => inv.id === it.itemId || inv.id === it.productId);
        const byName = linked || inventoryForEdit.find((inv: any) =>
          (inv.name || '').trim().toLowerCase() === (it.name || '').trim().toLowerCase()
        );
        return {
          id: i + 1,
          name: it.name || byName?.name || '',
          productId: byName?.id || it.itemId || it.productId || '',
          unit: it.unit || byName?.unit || 'pcs',
          quantity: it.quantity || 1,
          price: it.price ?? byName?.sellingPrice ?? 0,
          maxQuantity: byName?.quantity,
        };
      });

      setEditingSale(saleDetails);
      setOrderType(saleDetails.orderType || 'bag');
      reset({
        customerId: resolvedCustomerId,
        status: saleDetails.status || 'Pending',
        notes: saleDetails.notes || '',
      });
      setItems(rows.length ? rows : [blankItem(1)]);
      setNextId((rows.length || 1) + 1);
      setDeliveryCharge(saleDetails.deliveryCharge || 0);
      setPreviousBalance(saleDetails.previousBalance || 0);
      setAmountPaid(saleDetails.amountPaid || 0);
      setItemErrors(null);
      setIsModalOpen(true);
    } catch {
      toastError('Failed to load saved order details. Please try again.');
    }
  };

  const onEdit = async (data: any) => {
    if (!editingSale) return;
    const invalid = items.some(r => !r.name.trim() || r.quantity < 1 || r.price < 0 || (r.productId && r.quantity > (r.maxQuantity || 0)));
    if (invalid) {
      const overStockItem = items.find(r => r.productId && r.quantity > (r.maxQuantity || 0));
      if (overStockItem) {
        setItemErrors(`Quantity for "${overStockItem.name}" exceeds available stock (max: ${overStockItem.maxQuantity}).`);
      } else {
        setItemErrors('Please fill in all item rows completely.');
      }
      return;
    }
    setItemErrors(null);
    try {
      const selectedParty = parties.find(p => p.id === data.customerId);
      const customerName = selectedParty ? selectedParty.name : (editingSale.customer?.name || editingSale.customer);
      const payload = {
        customer: customerName,
        customerId: data.customerId || null,
        status: data.status,
        notes: data.notes,
        deliveryCharge: deliveryCharge || 0,
        previousBalance: previousBalance || 0,
        amountPaid: amountPaid || 0,
        items: items.map(r => ({ itemId: r.productId || undefined, name: r.name, unit: r.unit || 'pcs', quantity: r.quantity, price: r.price })),
      };
      const res = await fetch(`/api/sales/${editingSale.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to update order'); }
      const updated = await fetch('/api/sales').then(r => r.json());
      setSales(Array.isArray(updated) ? updated : []);
      closeModal();
      success('Order updated successfully.');
    } catch (err: any) { toastError(err.message || 'Failed to update order'); }
  };

  const onDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/sales/${id}`, { method: 'DELETE' });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to delete order'); }
      setSales(prev => prev.filter(s => s.id !== id));
      success('Order deleted.');
    } catch (err: any) { toastError(err.message || 'Failed to delete order'); }
    setDeleteConfirmId(null);
  };

  // Reset items when order type changes
  useEffect(() => {
    if (editingSale) return;
    setItems([blankItem(1)]);
    setNextId(2);
    setItemErrors(null);
  }, [orderType]);

  useEffect(() => {
    if (isModalOpen) {
      if (parties.length === 0) {
        fetch('/api/parties').then(r => r.json()).then(data => setParties(Array.isArray(data) ? data : [])).catch(console.error);
      }
      if (inventory.length === 0) {
        fetch('/api/inventory')
          .then(r => r.json())
          .then(data => {
            const sellableItems = Array.isArray(data)
              ? data.filter((item: any) => !item.soldAt && (item.quantity ?? 0) > 0)
              : [];
            if (isModalOpen && editingSale?.items?.length) {
              const selectedItems = editingSale.items
                .map((it: any) => ({
                  id: it.itemId || it.productId,
                  name: it.name || '',
                  quantity: it.quantity || 0,
                  unit: it.unit || 'pcs',
                  sellingPrice: it.price || 0,
                  soldAt: 'edit-only',
                }))
                .filter((it: any) => it.id);
              const mergedItems = [...sellableItems];
              for (const item of selectedItems) {
                if (!mergedItems.some((existing: any) => existing.id === item.id)) {
                  mergedItems.push(item);
                }
              }
              setInventory(mergedItems);
            } else {
              setInventory(sellableItems);
            }
          })
          .catch(console.error);
      }
    }
  }, [isModalOpen, parties.length, inventory.length]);

  // ─── Item row helpers ───────────────────────────────────────────────────────
  const updateItem = (id: number, field: keyof Omit<ItemRow, 'id'>, value: string | number) => {
    setItems(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const addRow = () => {
    setItems(prev => [...prev, blankItem(nextId)]);
    setNextId(n => n + 1);
  };

  const removeRow = (id: number) => {
    setItems(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev);
  };

  // ─── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = async (data: any) => {
    // Validate all rows are filled and quantity doesn't exceed stock
    const invalid = items.some(r => !r.name.trim() || r.quantity < 1 || r.price < 0 || (r.productId && r.quantity > (r.maxQuantity || 0)));
    if (invalid) {
      const overStockItem = items.find(r => r.productId && r.quantity > (r.maxQuantity || 0));
      if (overStockItem) {
        setItemErrors(`Quantity for "${overStockItem.name}" exceeds available stock (max: ${overStockItem.maxQuantity}).`);
      } else {
        setItemErrors('Please fill in all item rows completely.');
      }
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
        deliveryCharge: deliveryCharge || 0,
        previousBalance: previousBalance || 0,
        amountPaid: amountPaid || 0,
        items: items.map(r => ({
          itemId: r.productId || undefined,
          name: r.name,
          unit: r.unit || 'pcs',
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
      closeModal();
      success('Order created successfully.');
    } catch (err) {
      console.error(err);
      toastError('Failed to create order. Please try again.');
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
  const itemsSubtotal = items.reduce((acc, r) => acc + r.quantity * r.price, 0);
  const orderTotal = itemsSubtotal + (deliveryCharge || 0);

  return (
    <main className="flex-1 md:ml-sidebar-width p-container-padding overflow-y-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-h1 text-h1 text-primary">Sales Orders</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">
            Deliver finished products to customers. Track payments and shipments here.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-surface-container-lowest text-on-surface-variant border border-outline-variant font-body-md text-body-md px-4 py-2.5 rounded-DEFAULT hover:bg-surface-container-low transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-DEFAULT font-body-md hover:bg-inverse-surface active:scale-[0.98] transition-all self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Order
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 ambient-shadow flex flex-col justify-between h-[120px]">
          <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Total Revenue</div>
          <div className="flex items-end justify-between">
            <div className="font-h2 text-h2 text-primary">{formatCurrency(totalRevenue)}</div>
            <span className="material-symbols-outlined text-primary">trending_up</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 ambient-shadow flex flex-col justify-between h-[120px]">
          <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Orders Pending</div>
          <div className="flex items-end justify-between">
            <div className="font-h2 text-h2 text-primary">{pendingOrders}</div>
            <span className="material-symbols-outlined text-[#e65100]">pending_actions</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 ambient-shadow flex flex-col justify-between h-[120px]">
          <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Avg Order Value</div>
          <div className="flex items-end justify-between">
            <div className="font-h2 text-h2 text-primary">{formatCurrency(avgOrderValue)}</div>
            <span className="material-symbols-outlined text-outline">analytics</span>
          </div>
        </div>
        </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 mb-5">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button className="flex items-center gap-2 px-3 py-2 border border-outline-variant rounded-DEFAULT bg-surface-container-lowest text-on-surface-variant font-body-sm text-body-sm hover:bg-surface-container-low w-full sm:w-auto justify-center">
              <span className="material-symbols-outlined text-[18px]">filter_list</span>Filter
            </button>
            <button className="flex items-center gap-2 px-3 py-2 border border-outline-variant rounded-DEFAULT bg-surface-container-lowest text-on-surface-variant font-body-sm text-body-sm hover:bg-surface-container-low w-full sm:w-auto justify-center">
              <span className="material-symbols-outlined text-[18px]">sort</span>Sort
            </button>
          </div>
          <div className="relative flex-1 sm:max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
            <input
              type="text"
              placeholder="Search orders by ID, Customer..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-body-md text-primary placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl ambient-shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-variant bg-surface-bright flex items-center justify-between">
          <h3 className="font-h3 text-h3 text-primary">Sales Ledger</h3>
          <span className="text-body-sm text-on-surface-variant">{filteredSales.length} order{filteredSales.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-surface-container-low font-data-tabular text-data-tabular text-on-surface-variant border-b border-surface-variant">
              <tr>
                <th className="py-3 px-6 font-medium">Order ID</th>
                <th className="py-3 px-4 font-medium hidden sm:table-cell">Date</th>
                <th className="py-3 px-4 font-medium">Customer</th>
                <th className="py-3 px-4 font-medium text-right">Total</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm text-on-surface divide-y divide-surface-variant">
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant">Loading sales data...</td></tr>
                ) : filteredSales.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant">No sales found.</td></tr>
                ) : (
                  filteredSales.map(sale => (
                    <tr key={sale.id} className="hover:bg-surface-container-low transition-colors group">
                      <td className="py-3 px-6 whitespace-nowrap font-data-tabular text-data-tabular text-primary font-medium">{sale.invoiceNo || sale.id}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-on-surface-variant hidden sm:table-cell">{sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : 'N/A'}</td>
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-on-surface">{sale.customer?.name || sale.customer || 'Walk-in Customer'}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-right font-data-tabular text-data-tabular font-medium">{formatCurrency(sale.totalAmount || 0)}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {sale.status?.toLowerCase() === 'pending' || sale.status?.toLowerCase() === 'processing' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full font-label-caps text-label-caps bg-tertiary-fixed text-on-tertiary-fixed capitalize">{sale.status}</span>
                        ) : sale.status?.toLowerCase() === 'delayed' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full font-label-caps text-label-caps bg-error-container text-on-error-container capitalize">{sale.status}</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full font-label-caps text-label-caps bg-secondary-container text-on-secondary-container capitalize">{sale.status || 'Completed'}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right">
                        {(() => {
                          const isPaid = sale.status?.toLowerCase() === 'paid';
                          return (
                            <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                className="p-1 rounded text-primary hover:bg-primary-container transition-colors"
                                title="Print Invoice"
                                onClick={() => printInvoice(sale)}
                              >
                                <span className="material-symbols-outlined text-[18px]">print</span>
                              </button>
                              <button
                                className={`p-1 rounded transition-colors ${isPaid ? 'text-outline-variant cursor-not-allowed' : 'text-on-surface-variant hover:text-primary hover:bg-primary-container'}`}
                                title={isPaid ? 'Cannot edit a paid order' : 'Edit order'}
                                disabled={isPaid}
                                onClick={() => !isPaid && openEdit(sale)}
                              >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                              <button
                                className={`p-1 rounded transition-colors ${isPaid ? 'text-outline-variant cursor-not-allowed' : 'text-on-surface-variant hover:text-error hover:bg-error-container'}`}
                                title={isPaid ? 'Cannot delete a paid order' : 'Delete order'}
                                disabled={isPaid}
                                onClick={() => !isPaid && setDeleteConfirmId(sale.id)}
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Placeholder */}
          <div className="px-6 py-4 border-t border-surface-variant bg-surface-bright flex items-center justify-between">
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
        </div>

      {/* ── Create Order Modal ────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-xl">

            {/* Header */}
            <div className="px-6 py-4 border-b border-surface-variant flex justify-between items-center shrink-0">
              <div>
                <h2 className="font-h2 text-h2 text-primary">
                  {editingSale ? 'Edit Order' : 'Create New Order'}
                </h2>
                {editingSale && (
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{editingSale.invoiceNo || editingSale.id}</p>
                )}
              </div>
              <button onClick={closeModal} className="p-2 text-on-surface-variant hover:bg-surface-container hover:text-on-surface rounded-full transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1">
              <form id="create-order-form" onSubmit={handleSubmit(editingSale ? onEdit : onSubmit)} className="p-6 space-y-5">

                {/* Customer */}
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1.5 uppercase tracking-wider">Customer *</label>
                  <select
                    {...register('customerId', { required: true })}
                    className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                    onChange={e => {
                      setValue('customerId', e.target.value);
                      if (!editingSale) fetchPartyBalance(e.target.value);
                    }}
                  >
                    <option value="">-- Select Customer --</option>
                    {parties.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Order Type */}
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1.5 uppercase tracking-wider">Order Type</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setOrderType('bag')} className={`flex-1 py-2 rounded border text-body-sm font-semibold transition-all ${orderType === 'bag' ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'}`}>Bag Order</button>
                    <button type="button" onClick={() => setOrderType('printing')} className={`flex-1 py-2 rounded border text-body-sm font-semibold transition-all ${orderType === 'printing' ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'}`}>Printing Service</button>
                  </div>
                </div>

                {/* ── Items section ────────────────────────────────────────── */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-body-sm font-semibold text-on-surface">Items</label>
                    <span className="font-body-sm text-on-surface-variant">{items.length} row{items.length !== 1 ? 's' : ''}</span>
                  </div>

                  <div className="border border-outline-variant rounded-lg overflow-hidden">
                    {/* Column headers */}
                    <div className="grid grid-cols-[1fr_70px_80px_90px_36px] gap-0 bg-surface-container px-3 py-2 border-b border-outline-variant">
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider text-xs">Product Name</span>
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider text-xs text-center">Unit</span>
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider text-xs text-center">Qty</span>
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider text-xs text-right">Price / Unit ₹</span>
                      <span />
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-outline-variant">
                      {items.map((row) => {
                        return (
                        <div key={row.id} className="grid grid-cols-[1fr_70px_80px_90px_36px] gap-0 items-center px-3 py-2">
                          {/* Product Name - Editable text with inventory picker */}
                          <div className="flex gap-1 items-center mr-1">
                            <input
                              type="text"
                              value={row.name}
                              onChange={e => {
                                const name = e.target.value;
                                if (row.productId) {
                                  const product = inventory.find(inv => inv.id === row.productId);
                                  if (product && name !== product.name) {
                                    updateItem(row.id, 'productId', '');
                                    updateItem(row.id, 'maxQuantity', 0);
                                  }
                                }
                                updateItem(row.id, 'name', name);
                              }}
                              placeholder="Product name"
                              className="flex-1 min-w-0 px-2 py-1.5 border border-outline-variant rounded text-body-sm text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-1 focus:ring-primary"
                              required
                            />
                            <select
                              value=""
                              onChange={e => {
                                const productId = e.target.value;
                                if (!productId) return;
                                const product = inventory.find(inv => inv.id === productId);
                                if (product) {
                                  updateItem(row.id, 'name', product.name);
                                  updateItem(row.id, 'productId', productId);
                                  updateItem(row.id, 'unit', product.unit || 'pcs');
                                  updateItem(row.id, 'price', product.sellingPrice || 0);
                                  updateItem(row.id, 'maxQuantity', product.quantity || 0);
                                  updateItem(row.id, 'quantity', Math.min(row.quantity, product.quantity || 1));
                                }
                              }}
                              className="flex-shrink-0 w-9 px-0 py-1.5 border border-outline-variant rounded text-body-sm text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-1 focus:ring-primary text-center text-lg"
                              title="Select from inventory"
                            >
                              <option value="">+</option>
                              {inventory.map(inv => (
                                <option key={inv.id} value={inv.id}>
                                  {inv.name} ({inv.quantity} {inv.unit || 'pcs'})
                                </option>
                              ))}
                            </select>
                          </div>
                          {/* Unit */}
                          <select
                            value={row.unit}
                            onChange={e => updateItem(row.id, 'unit', e.target.value)}
                            className="w-full px-1 py-1.5 border border-outline-variant rounded text-body-sm text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-1 focus:ring-primary mx-1 text-center"
                          >
                            <option value="pcs">pcs</option>
                            <option value="kg">kg</option>
                            <option value="m">m</option>
                            <option value="box">box</option>
                            <option value="roll">roll</option>
                            <option value="set">set</option>
                          </select>
                          {/* Quantity */}
                          <input
                            type="number"
                            min={1}
                            max={row.maxQuantity || 999999}
                            value={row.quantity}
                            onChange={e => {
                              const val = parseInt(e.target.value) || 1;
                              const maxAllowed = row.maxQuantity || 999999;
                              updateItem(row.id, 'quantity', Math.min(Math.max(1, val), maxAllowed));
                            }}
                            title={row.maxQuantity ? `Max available: ${row.maxQuantity}` : 'Quantity'}
                            className="w-full px-2 py-1.5 border border-outline-variant rounded text-body-sm text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-1 focus:ring-primary mx-1 text-center"
                          />
                          {/* Price per unit */}
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={row.price}
                            onChange={e => updateItem(row.id, 'price', parseFloat(e.target.value) || 0)}
                            title="Price per unit"
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
                      );
                      })}
                    </div>

                    {/* Add row button */}
                    <button
                      type="button"
                      onClick={addRow}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 text-primary hover:bg-primary-container text-body-sm font-medium transition-colors border-t border-outline-variant"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      Add Item
                    </button>
                  </div>

                  {/* Validation error */}
                  {itemErrors && (
                    <p className="mt-1.5 text-error font-body-sm text-xs">{itemErrors}</p>
                  )}

                  {/* Live total */}
                  {/* Delivery Charge */}
                  <div className="mt-4">
                    <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1.5 uppercase tracking-wider">
                      Delivery Charges
                      <span className="ml-1 text-xs text-outline">(optional)</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">local_shipping</span>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={deliveryCharge}
                        onChange={e => setDeliveryCharge(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full pl-9 pr-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Previous Balance */}
                  <div className="mt-4">
                    <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1.5 uppercase tracking-wider">
                      Previous Balance
                      {fetchingBalance && <span className="ml-2 text-xs text-primary animate-pulse">Loading…</span>}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-body-sm text-sm">₹</span>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={previousBalance}
                        onChange={e => setPreviousBalance(parseFloat(e.target.value) || 0)}
                        className="w-full pl-7 pr-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Live Total Display */}
                  <div className="mt-4 flex justify-end bg-surface-container p-3 rounded-lg border border-outline-variant">
                    <div className="text-right space-y-1 w-full sm:w-auto min-w-[200px]">
                      {deliveryCharge > 0 && (
                        <div className="font-body-sm text-on-surface-variant flex justify-between">
                          <span>Subtotal:</span> <span className="font-medium text-on-surface ml-4">{formatCurrency(itemsSubtotal)}</span>
                        </div>
                      )}
                      {deliveryCharge > 0 && (
                        <div className="font-body-sm text-on-surface-variant flex justify-between">
                          <span>Delivery:</span> <span className="font-medium text-on-surface ml-4">{formatCurrency(deliveryCharge)}</span>
                        </div>
                      )}
                      {previousBalance > 0 && (
                        <div className="font-body-sm text-on-surface-variant flex justify-between">
                          <span>Previous Balance:</span> <span className="font-medium text-on-surface ml-4">{formatCurrency(previousBalance)}</span>
                        </div>
                      )}
                      <div className="font-body-sm text-on-surface-variant flex justify-between items-center border-t border-outline-variant pt-2 mt-2">
                        <span>Total Payable:</span> <span className="font-semibold text-primary text-lg ml-4">{formatCurrency(orderTotal + previousBalance)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1.5 uppercase tracking-wider">Order Status</label>
                  <select {...register('status')} className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="Pending">Pending</option>
                    <option value="In Production">In Production</option>
                    <option value="Completed">Completed</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>

                {/* Payment Section */}
                <div className="border border-outline-variant rounded-lg p-4 bg-surface-container space-y-3">
                  <p className="font-body-sm font-semibold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-primary">payments</span>
                    Payment
                  </p>

                  {/* Amount Paid */}
                  <div>
                    <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1.5 uppercase tracking-wider">Amount Received</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-body-sm text-sm">₹</span>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={amountPaid}
                        onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)}
                        className="w-full pl-7 pr-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Balance Due preview */}
                  {(() => {
                    const due = orderTotal + previousBalance - amountPaid;
                    return (
                      <div className={`flex justify-between items-center pt-2 border-t border-outline-variant font-body-sm font-semibold ${
                        due > 0 ? 'text-error' : 'text-[#4caf50]'
                      }`}>
                        <span>Remaining Balance</span>
                        <span>{formatCurrency(Math.max(0, due))}</span>
                      </div>
                    );
                  })()}
                </div>

                {/* Notes */}
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1.5 uppercase tracking-wider">Notes</label>
                  <textarea {...register('notes')} className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" rows={2} />
                </div>

              </form>
            </div>

            {/* Footer actions — always visible */}
            <div className="px-6 py-4 border-t border-surface-variant shrink-0 flex justify-end gap-3 bg-surface-bright rounded-b-xl">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded border border-outline-variant text-on-surface-variant font-body-md hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-order-form"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded bg-primary text-on-primary font-body-md font-semibold hover:bg-inverse-surface active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
                {isSubmitting ? 'Saving...' : editingSale ? 'Save Changes' : 'Create Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Dialog ─────────────────────────────────────────────── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined text-error text-[28px]">warning</span>
              <h3 className="font-h2 text-h2 text-error">Delete Order?</h3>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6">This action cannot be undone. The order and all its items will be permanently removed.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded border border-outline-variant text-on-surface-variant font-body-md hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onDelete(deleteConfirmId)}
                className="px-5 py-2 rounded bg-error text-on-error font-body-md font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
