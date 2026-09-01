"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

export default function ProductionPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [finishedProducts, setFinishedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<Array<{ itemId: string; quantity: number }>>([]);
  
  const { register, control, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm({
    defaultValues: {
      finishedProductId: "",
      producedQuantity: 1,
      wasteQuantity: 0,
      costPerPcs: 0,
      status: "Pending",
      notes: "",
    }
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/production').then(r => r.json()),
      fetch('/api/inventory').then(r => r.json())
    ])
    .then(([batchesData, invData]) => {
      setBatches(Array.isArray(batchesData) ? batchesData : []);
      const allInventory = Array.isArray(invData) ? invData : [];
    const raw = allInventory.filter((item: any) => item.type !== 'finished-product');
    const finished = allInventory.filter((item: any) => item.type === 'finished-product' && !item.soldAt);
      setRawMaterials(raw);
      setFinishedProducts(finished);
      setLoading(false);
    })
    .catch(console.error);
  }, []);



  const onSubmit = async (data: any) => {
    try {
      const payload = {
        finishedProductId: data.finishedProductId,
        rawMaterials: selectedMaterials,
        producedQuantity: Number(data.producedQuantity),
        wasteQuantity: Number(data.wasteQuantity) || 0,
        costPerPcs: Number(data.costPerPcs),
        status: data.status || 'Pending',
        notes: data.notes,
      };
      const res = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
      
      const newBatch = await res.json();
      setBatches(prev => [newBatch, ...prev]);
      setIsModalOpen(false);
      reset();
      setSelectedMaterials([]);
      
      // refetch inventory if it was completed (because stock changed)
      if (data.status === 'Completed') {
        fetch('/api/inventory').then(r => r.json()).then(invData => {
          const allInventory = Array.isArray(invData) ? invData : [];
          const raw = allInventory.filter((item: any) => item.type !== 'finished-product');
          const finished = allInventory.filter((item: any) => item.type === 'finished-product' && !item.soldAt);
          setRawMaterials(raw);
          setFinishedProducts(finished);
        });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to create production batch');
    }
  };

  const filteredBatches = batches.map(b => ({
    ...b,
    finishedProductName: finishedProducts.find(fp => fp.id === b.finishedProductId)?.name || 'Unknown'
  })).filter(b => 
    b.batchNo?.toLowerCase().includes(search.toLowerCase()) || 
    b.finishedProductName?.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  return (
    <div className="w-full h-full md:ml-sidebar-width p-container-padding overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-h1 text-h1 text-primary mb-1">Production</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Convert raw materials into finished products. Track batches from start to completion.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-primary text-on-primary font-body-md text-body-md px-4 py-2 rounded-DEFAULT hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Batch
          </button>
        </header>

        <section className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden flex flex-col shadow-sm">
          <div className="p-4 border-b border-outline-variant bg-surface flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-96">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">search</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-DEFAULT bg-surface-container-lowest font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="Search batches..." type="text"/>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-zebra">
              <thead className="bg-surface-container text-on-surface-variant font-label-caps text-label-caps border-b border-outline-variant">
                <tr>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider">Batch No</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider">Qty Produced</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider">Cost / Pcs</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider">Total Cost</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm text-on-surface divide-y divide-outline-variant">
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant">Loading...</td></tr>
                ) : filteredBatches.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant">No production batches found.</td></tr>
                ) : (
                  filteredBatches.map(batch => (
                    <tr key={batch.id} className="hover:bg-surface-container-high transition-colors group">
                      <td className="px-4 py-3 font-data-tabular text-on-surface-variant">{batch.batchNo}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{batch.finishedProductName}</div>
                      </td>
                      <td className="px-4 py-3 font-data-tabular">
                        {batch.producedQuantity}
                      </td>
                      <td className="px-4 py-3 font-data-tabular">{formatCurrency(batch.costPerPcs)}</td>
                      <td className="px-4 py-3 font-data-tabular font-medium text-primary">{formatCurrency(batch.totalCost)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-label-caps text-label-caps uppercase ${
                          batch.status === 'Completed' ? 'bg-secondary-container text-on-secondary-container' :
                          batch.status === 'In Production' ? 'bg-tertiary-container text-on-tertiary-container' :
                          'bg-surface-variant text-on-surface-variant'
                        }`}>
                          {batch.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center sticky top-0 bg-surface-container-lowest z-10">
              <h2 className="font-h2 text-h2 text-primary">Create Production Batch</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full hover:bg-surface-container transition-colors"><span className="material-symbols-outlined">close</span></button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              {/* Finished Product Selection */}
              <div className="space-y-4">
                <h3 className="font-h3 text-h3 text-primary border-b pb-2">Finished Product</h3>
                <div>
                  <label className="block font-body-sm text-on-surface-variant mb-1">Select Finished Product *</label>
                  <select {...register('finishedProductId', { required: true })} className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest focus:ring-2 focus:ring-primary" required>
                    <option value="">-- Select Product to Produce --</option>
                    {finishedProducts.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Raw Materials Selection */}
              <div className="space-y-4">
                <h3 className="font-h3 text-h3 text-primary border-b pb-2">Raw Materials Used</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto border border-outline-variant rounded p-3 bg-surface-container-lowest">
                  {rawMaterials.length === 0 ? (
                    <p className="text-on-surface-variant text-sm">No raw materials available</p>
                  ) : (
                    rawMaterials.map(material => (
                      <div key={material.id} className="flex items-end gap-2 pb-2 border-b border-outline-variant last:border-b-0">
                        <div className="flex-1">
                          <label className="block font-body-sm text-on-surface-variant mb-1">{material.name}</label>
                          <div className="text-xs text-on-surface-variant">Available: {material.quantity} {material.unit}</div>
                        </div>
                        <input 
                          type="number" 
                          min="0"
                          max={material.quantity}
                          placeholder="Qty"
                          value={selectedMaterials.find(m => m.itemId === material.id)?.quantity || ''} 
                          onChange={(e) => {
                            const qty = parseInt(e.target.value) || 0;
                            if (qty === 0) {
                              setSelectedMaterials(prev => prev.filter(m => m.itemId !== material.id));
                            } else {
                              setSelectedMaterials(prev => {
                                const existing = prev.find(m => m.itemId === material.id);
                                if (existing) {
                                  return prev.map(m => m.itemId === material.id ? { ...m, quantity: qty } : m);
                                } else {
                                  return [...prev, { itemId: material.id, quantity: qty }];
                                }
                              });
                            }
                          }}
                          className="w-20 px-2 py-1.5 border border-outline-variant rounded text-sm text-right focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    ))
                  )}
                </div>
                {selectedMaterials.length > 0 && (
                  <div className="text-sm text-on-surface-variant">
                    <strong>Selected:</strong> {selectedMaterials.length} material(s)
                  </div>
                )}
              </div>

              {/* Production Details */}
              <div className="space-y-4">
                <h3 className="font-h3 text-h3 text-primary border-b pb-2">Production Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-body-sm text-on-surface-variant mb-1">Produced Quantity *</label>
                    <input type="number" min="1" {...register('producedQuantity', { required: true })} className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest focus:ring-2 focus:ring-primary" required />
                  </div>
                  <div>
                    <label className="block font-body-sm text-on-surface-variant mb-1">Waste Quantity</label>
                    <input type="number" min="0" {...register('wasteQuantity')} className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block font-body-sm text-on-surface-variant mb-1">Cost Per Pcs (₹)</label>
                    <input type="number" step="0.01" min="0" {...register('costPerPcs')} className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
                
                <div>
                  <label className="block font-body-sm text-on-surface-variant mb-1">Status</label>
                  <select {...register('status')} className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest focus:ring-2 focus:ring-primary">
                    <option value="Pending">Pending</option>
                    <option value="In Production">In Production</option>
                    <option value="Completed">Completed (Consume materials & Add to inventory)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-body-sm text-on-surface-variant mb-1">Notes</label>
                  <textarea {...register('notes')} className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest focus:ring-2 focus:ring-primary" rows={2}></textarea>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant">
                <button type="button" onClick={() => { setIsModalOpen(false); setSelectedMaterials([]); }} className="px-4 py-2 border border-outline-variant rounded text-on-surface hover:bg-surface-container-low transition-colors font-body-md">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-primary text-on-primary rounded font-body-md font-semibold hover:bg-on-primary-fixed disabled:opacity-50 transition-colors flex items-center gap-2">
                  {isSubmitting ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : null}
                  {isSubmitting ? 'Saving...' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
