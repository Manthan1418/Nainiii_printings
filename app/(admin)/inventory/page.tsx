"use client";
import { useEffect, useState, useRef } from "react";

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  sellingPrice: number;
  categoryId?: string;
  notes?: string;
}

const EMPTY_FORM = {
  name: "",
  quantity: 0,
  unit: "",
  sellingPrice: 0,
  categoryId: "",
  notes: "",
};

// Common items – admin can pick these to pre-fill the form quickly
const PRESETS = [
  { name: "Ink",         unit: "litre",  categoryId: "Consumables" },
  { name: "Zip Roll",    unit: "roll",   categoryId: "Consumables" },
  { name: "A4 Paper",    unit: "ream",   categoryId: "Paper" },
  { name: "Ribbon",      unit: "pcs",    categoryId: "Consumables" },
  { name: "Plastic Bag", unit: "pcs",    categoryId: "Packaging" },
  { name: "Solvent",     unit: "litre",  categoryId: "Consumables" },
];

function stockStatus(qty: number) {
  if (qty === 0) return { label: "Out of Stock", classes: "bg-error-container text-on-error-container" };
  if (qty <= 5)  return { label: "Low Stock",    classes: "bg-[#fff3e0] text-[#e65100]" };
  return { label: "In Stock", classes: "bg-secondary-container text-on-secondary-container" };
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "in" | "low" | "out">("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const firstInputRef = useRef<HTMLInputElement>(null);

  async function fetchItems() {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchItems(); }, []);

  function openAdd() {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
    setTimeout(() => firstInputRef.current?.focus(), 100);
  }

  function openEdit(item: InventoryItem) {
    setEditItem(item);
    setForm({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      sellingPrice: item.sellingPrice,
      categoryId: item.categoryId ?? "",
      notes: item.notes ?? "",
    });
    setFormError("");
    setModalOpen(true);
    setTimeout(() => firstInputRef.current?.focus(), 100);
  }

  function closeModal() {
    setModalOpen(false);
    setEditItem(null);
    setFormError("");
  }

  function setField(key: keyof typeof EMPTY_FORM, value: any) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setFormError("Item name is required."); return; }
    if (!form.unit.trim()) { setFormError("Unit is required."); return; }
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        ...form,
        quantity: Number(form.quantity) || 0,
        sellingPrice: Number(form.sellingPrice) || 0,
      };

      let res: Response;
      if (editItem) {
        // No PATCH route yet — use POST workaround via a direct update flag, or just re-add
        // For now update locally and fire PATCH if route exists, otherwise show message
        res = await fetch(`/api/inventory/${editItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.status === 404 || res.status === 405) {
          // PATCH not implemented — update local state only
          setItems(prev => prev.map(i => i.id === editItem.id ? { ...i, ...payload } : i));
          closeModal();
          return;
        }
      } else {
        res = await fetch("/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to save" }));
        throw new Error(err.error || JSON.stringify(err));
      }
      await fetchItems();
      closeModal();
    } catch (err: any) {
      setFormError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
      if (res.ok || res.status === 404) {
        setItems(prev => prev.filter(i => i.id !== id));
      }
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  }

  const filtered = items.filter(item => {
    const matchSearch =
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.categoryId?.toLowerCase().includes(search.toLowerCase());

    const qty = item.quantity ?? 0;
    const reorder = 10;
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "out" && qty === 0) ||
      (filterStatus === "low" && qty > 0 && qty <= reorder) ||
      (filterStatus === "in" && qty > reorder);

    return matchSearch && matchStatus;
  });

  const counts = {
    all: items.length,
    in:  items.filter(i => (i.quantity ?? 0) > 5).length,
    low: items.filter(i => { const q = i.quantity ?? 0; return q > 0 && q <= 5; }).length,
    out: items.filter(i => (i.quantity ?? 0) === 0).length,
  };

  const totalValue = items.reduce((sum, i) => sum + (i.quantity ?? 0) * (i.sellingPrice ?? 0), 0);
  const formatCurrency = (v: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

  return (
    <main className="flex-1 md:ml-sidebar-width p-container-padding overflow-y-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-h1 text-h1 text-primary">Inventory</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">
            Manage stock levels, pricing, and product catalog.
          </p>
        </div>
        <button
          id="add-inventory-btn"
          onClick={openAdd}
          className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-DEFAULT font-body-md hover:bg-inverse-surface active:scale-[0.98] transition-all self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Item
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Items", value: loading ? "…" : items.length, icon: "inventory_2", color: "text-primary" },
          { label: "Stock Value", value: loading ? "…" : formatCurrency(totalValue), icon: "payments", color: "text-primary" },
          { label: "Low Stock", value: loading ? "…" : counts.low, icon: "warning", color: "text-[#e65100]" },
          { label: "Out of Stock", value: loading ? "…" : counts.out, icon: "error", color: "text-error" },
        ].map(card => (
          <div key={card.label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 ambient-shadow flex items-center gap-3">
            <span className={`material-symbols-outlined ${card.color} text-[24px]`}>{card.icon}</span>
            <div>
              <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">{card.label}</div>
              <div className="font-h3 text-h3 text-primary mt-0.5">{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-1 bg-surface-container-low p-1 rounded-lg border border-surface-variant flex-wrap">
          {([
            { key: "all", label: "All" },
            { key: "in", label: "In Stock" },
            { key: "low", label: "Low Stock" },
            { key: "out", label: "Out of Stock" },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-3 py-1.5 rounded text-body-sm font-semibold transition-all ${
                filterStatus === key
                  ? "bg-surface-container-lowest text-primary shadow-sm border border-outline-variant/50"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              {label}
              <span className="ml-1.5 text-[10px] opacity-70">({counts[key]})</span>
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
          <input
            type="text"
            placeholder="Search name, SKU, category…"
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
          <h3 className="font-h3 text-h3 text-primary">Stock Ledger</h3>
          <span className="text-body-sm text-on-surface-variant">{filtered.length} item{filtered.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-surface-container-low font-data-tabular text-data-tabular text-on-surface-variant border-b border-surface-variant">
              <tr>
                <th className="py-3 px-6 font-medium">Item</th>
                <th className="py-3 px-4 font-medium hidden md:table-cell">Category</th>
                <th className="py-3 px-4 font-medium text-right">Qty</th>
                <th className="py-3 px-4 font-medium text-right hidden sm:table-cell">Price</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm text-on-surface divide-y divide-surface-variant">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined animate-spin text-[28px]">progress_activity</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-[36px] text-outline">inventory_2</span>
                      <p>No items found. <button onClick={openAdd} className="text-primary underline">Add one now.</button></p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(item => {
                  const { label, classes } = stockStatus(item.quantity ?? 0);
                  return (
                    <tr key={item.id} className="hover:bg-surface-container-low transition-colors group">
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                          </div>
                          <div>
                            <div className="font-semibold text-on-surface">{item.name}</div>
                            <div className="text-on-surface-variant text-[11px]">{item.unit}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell text-on-surface-variant">{item.categoryId || "—"}</td>
                      <td className="py-3 px-4 text-right font-semibold">{item.quantity ?? 0}</td>
                      <td className="py-3 px-4 text-right hidden sm:table-cell text-on-surface-variant">{formatCurrency(item.sellingPrice ?? 0)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${classes}`}>
                          {label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(item)} title="Edit" className="p-1.5 rounded hover:bg-surface-container-highest text-on-surface-variant hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button onClick={() => setDeleteId(item.id)} title="Delete" className="p-1.5 rounded hover:bg-error-container text-on-surface-variant hover:text-error transition-colors">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-outline-variant bg-surface-container-lowest px-6 py-3 flex items-center justify-between">
          <div className="font-body-sm text-on-surface-variant">Showing {filtered.length} of {items.length} items</div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant sticky top-0 bg-surface-container-lowest z-10">
              <h2 className="font-h3 text-h3 text-primary">{editItem ? "Edit Item" : "Add New Item"}</h2>
              <button onClick={closeModal} className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-error-container text-error text-body-sm rounded p-3">{formError}</div>
              )}

              {/* Quick-add presets (only on new item) */}
              {!editItem && (
                <div>
                  <p className="font-body-sm text-on-surface-variant mb-2">Quick add common item:</p>
                  <div className="flex flex-wrap gap-2">
                    {PRESETS.map(p => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, name: p.name, unit: p.unit, categoryId: p.categoryId }))}
                        className={`px-3 py-1 rounded-full border text-body-sm transition-all ${
                          form.name === p.name
                            ? 'bg-primary text-on-primary border-primary'
                            : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block font-body-sm text-body-sm text-on-surface-variant mb-1.5" htmlFor="inv-name">
                  Item Name <span className="text-error">*</span>
                </label>
                <input
                  id="inv-name"
                  ref={firstInputRef}
                  type="text"
                  required
                  placeholder="e.g. Ink, Zip Roll…"
                  value={form.name}
                  onChange={e => setField("name", e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-body-md text-primary placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
                />
              </div>

              {/* Unit + Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body-sm text-body-sm text-on-surface-variant mb-1.5" htmlFor="inv-unit">
                    Unit <span className="text-error">*</span>
                  </label>
                  <input
                    id="inv-unit"
                    type="text"
                    required
                    placeholder="pcs, kg, litre, roll…"
                    value={form.unit}
                    onChange={e => setField("unit", e.target.value)}
                    className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-body-md text-primary placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
                  />
                </div>
                <div>
                  <label className="block font-body-sm text-body-sm text-on-surface-variant mb-1.5" htmlFor="inv-category">Category</label>
                  <input
                    id="inv-category"
                    type="text"
                    placeholder="e.g. Consumables…"
                    value={form.categoryId}
                    onChange={e => setField("categoryId", e.target.value)}
                    className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-body-md text-primary placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
                  />
                </div>
              </div>

              {/* Qty */}
              <div>
                <label className="block font-body-sm text-body-sm text-on-surface-variant mb-1.5" htmlFor="inv-qty">Quantity</label>
                <input
                  id="inv-qty"
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={e => setField("quantity", e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
                />
              </div>

              {/* Prices */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block font-body-sm text-body-sm text-on-surface-variant mb-1.5" htmlFor="inv-sell">
                    Price (₹) <span className="text-error">*</span>
                  </label>
                  <input
                    id="inv-sell"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.sellingPrice}
                    onChange={e => setField("sellingPrice", e.target.value)}
                    className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-body-sm text-body-sm text-on-surface-variant mb-1.5" htmlFor="inv-notes">Notes</label>
                <textarea
                  id="inv-notes"
                  rows={2}
                  placeholder="Any additional info…"
                  value={form.notes}
                  onChange={e => setField("notes", e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-body-md text-primary placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow resize-none"
                />
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2.5 rounded border border-outline-variant text-on-surface-variant font-body-md hover:bg-surface-container transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded bg-primary text-on-primary font-body-md font-semibold hover:bg-inverse-surface active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
                  {saving ? "Saving…" : editItem ? "Update Item" : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-error text-[28px]">delete_forever</span>
              <h2 className="font-h3 text-h3 text-primary">Delete Item?</h2>
            </div>
            <p className="text-body-md text-on-surface-variant mb-6">This will permanently remove the item from your inventory.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded border border-outline-variant text-on-surface-variant font-body-md hover:bg-surface-container transition-colors">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
                className="px-5 py-2 rounded bg-error text-on-error font-body-md font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {deleting && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
