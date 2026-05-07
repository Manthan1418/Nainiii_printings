"use client";
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const onSubmit = async (data: any) => {
    try {
      // Parse numbers
      data.quantity = parseInt(data.quantity) || 0;
      data.buyingPrice = parseFloat(data.buyingPrice) || 0;
      data.sellingPrice = parseFloat(data.sellingPrice) || 0;
      data.reorderLevel = parseInt(data.reorderLevel) || 0;

      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(await res.text());
      
      const updated = await fetch('/api/inventory').then(r => r.json());
      setItems(Array.isArray(updated) ? updated : []);
      setIsModalOpen(false);
      reset();
    } catch (err) {
      console.error(err);
      alert('Failed to add item');
    }
  };

  useEffect(() => {
    fetch('/api/inventory')
      .then(async res => {
        if (!res.ok) throw new Error(await res.text() || res.statusText);
        return res.json();
      })
      .then(data => {
        setItems(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setItems([]);
        setLoading(false);
      });
  }, []);

  const filteredItems = items.filter(item => 
    item.name?.toLowerCase().includes(search.toLowerCase()) || 
    item.sku?.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="w-full h-full">
      
<div className="p-container-padding flex-grow flex flex-col max-w-[1600px] w-full mx-auto">
{/* Page Header */}
<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
<div>
<h2 className="font-h1 text-h1 text-on-surface">Inventory</h2>
<p className="font-body-md text-body-md text-on-surface-variant mt-1">Manage stock levels and product catalog across all warehouses.</p>
</div>
<div className="flex items-center gap-3">
<div className="relative flex-grow md:w-64">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
<input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-tertiary-container focus:border-transparent transition-shadow" placeholder="Search by SKU or Name..." type="text"/>
</div>
<button className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-body-sm text-body-sm text-on-surface hover:bg-surface-container-low transition-colors">
<span className="material-symbols-outlined text-[18px]">filter_list</span>
<span>Filter</span>
</button>
<button onClick={() => setIsModalOpen(true)} className="hidden md:flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-DEFAULT font-body-sm text-body-sm font-semibold hover:bg-on-primary-fixed transition-colors">
<span className="material-symbols-outlined text-[18px]">add</span>
<span>Add Item</span>
</button>
</div>
</div>
{/* Structured Data Table */}
<div className="flex-grow bg-surface-container-lowest border border-outline-variant rounded-DEFAULT overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col">
<div className="overflow-x-auto flex-grow">
<table className="w-full text-left border-collapse min-w-[800px]">
<thead className="sticky top-0 bg-surface-container-low z-10 shadow-[0_1px_0_var(--tw-colors-outline-variant)]">
<tr>
<th className="px-4 py-3 font-label-caps text-label-caps text-on-surface-variant w-24">SKU</th>
<th className="px-4 py-3 font-label-caps text-label-caps text-on-surface-variant">Product Details</th>
<th className="px-4 py-3 font-label-caps text-label-caps text-on-surface-variant w-32">Category</th>
<th className="px-4 py-3 font-label-caps text-label-caps text-on-surface-variant text-right w-24">Stock</th>
<th className="px-4 py-3 font-label-caps text-label-caps text-on-surface-variant w-32">Status</th>
<th className="px-4 py-3 font-label-caps text-label-caps text-on-surface-variant text-right w-24">Actions</th>
</tr>
</thead>
<tbody className="font-data-tabular text-data-tabular text-on-surface bg-surface-container-lowest">
{loading ? (
  <tr><td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant">Loading inventory...</td></tr>
) : filteredItems.length === 0 ? (
  <tr><td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant">No items found.</td></tr>
) : (
  filteredItems.map((item, idx) => (
    <tr key={item.id} className={`border-b border-outline-variant/30 hover:bg-surface-container-high transition-colors group ${idx % 2 === 1 ? 'bg-surface-container-low/30' : ''}`}>
      <td className="px-4 py-2">{item.sku || 'N/A'}</td>
      <td className="px-4 py-2">
        <div className="font-body-sm font-semibold text-on-surface">{item.name}</div>
        {item.supplierId && <div className="text-on-surface-variant text-[11px] font-body-md mt-0.5">Supplier: {item.supplierId}</div>}
      </td>
      <td className="px-4 py-2 font-body-sm text-on-surface-variant">{item.category || item.categoryId || 'Uncategorized'}</td>
      <td className="px-4 py-2 text-right">{item.quantity ?? 0}</td>
      <td className="px-4 py-2">
        {(item.quantity ?? 0) > 10 ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-DEFAULT bg-secondary-container/50 text-secondary font-label-caps text-[10px]">In Stock</span>
        ) : (item.quantity ?? 0) > 0 ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-DEFAULT bg-[#fff3e0] text-[#e65100] font-label-caps text-[10px]">Low Stock</span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-DEFAULT bg-error-container text-on-error-container font-label-caps text-[10px]">Out of Stock</span>
        )}
      </td>
      <td className="px-4 py-2 text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1 text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined text-[18px]">edit</span></button>
          <button className="p-1 text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined text-[18px]">more_vert</span></button>
        </div>
      </td>
    </tr>
  ))
)}
</tbody>
</table>
</div>
{/* Pagination Footer */}
<div className="border-t border-outline-variant bg-surface-container-lowest px-4 py-3 flex items-center justify-between">
<div className="font-body-sm text-on-surface-variant">Showing {filteredItems.length} entries</div>
<div className="flex items-center gap-2">
<button className="p-1 rounded-DEFAULT border border-outline-variant text-on-surface-variant hover:bg-surface-container-low disabled:opacity-50" disabled><span className="material-symbols-outlined text-[18px]">chevron_left</span></button>
<button className="p-1 rounded-DEFAULT border border-outline-variant text-on-surface-variant hover:bg-surface-container-low"><span className="material-symbols-outlined text-[18px]">chevron_right</span></button>
</div>
</div>
</div>
</div>

{/* Create Modal */}
{isModalOpen && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className="bg-surface-container-lowest rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
      <div className="p-6 border-b border-outline-variant flex justify-between items-center sticky top-0 bg-surface-container-lowest z-10">
        <h2 className="font-h2 text-h2 text-on-surface">Add New Item</h2>
        <button onClick={() => setIsModalOpen(false)} className="text-on-surface-variant hover:text-on-surface"><span className="material-symbols-outlined">close</span></button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
        <div>
          <label className="block font-body-sm text-on-surface-variant mb-1">Name *</label>
          <input {...register('name', { required: true })} className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-body-sm text-on-surface-variant mb-1">SKU *</label>
            <input {...register('sku', { required: true })} className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" required />
          </div>
          <div>
            <label className="block font-body-sm text-on-surface-variant mb-1">Category</label>
            <input {...register('categoryId')} className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-body-sm text-on-surface-variant mb-1">Initial Quantity</label>
            <input type="number" {...register('quantity')} defaultValue="0" className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block font-body-sm text-on-surface-variant mb-1">Unit *</label>
            <input {...register('unit', { required: true })} placeholder="pcs, kg, etc." className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-body-sm text-on-surface-variant mb-1">Buying Price *</label>
            <input type="number" step="0.01" {...register('buyingPrice', { required: true })} className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" required />
          </div>
          <div>
            <label className="block font-body-sm text-on-surface-variant mb-1">Selling Price *</label>
            <input type="number" step="0.01" {...register('sellingPrice', { required: true })} className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" required />
          </div>
        </div>
        <div>
          <label className="block font-body-sm text-on-surface-variant mb-1">Supplier ID</label>
          <input {...register('supplierId')} className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant mt-6">
          <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-outline-variant rounded text-on-surface hover:bg-surface-container-low transition-colors font-body-sm">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary text-on-primary rounded font-body-sm font-medium hover:bg-on-primary-fixed disabled:opacity-50 transition-colors">
            {isSubmitting ? 'Saving...' : 'Save Item'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

    </div>
  );
}
