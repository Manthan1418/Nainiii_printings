"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

export default function FinancePage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'income' | 'expenses'>('income');
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const { register: regInc, handleSubmit: handleIncSubmit, reset: resetInc, formState: { isSubmitting: isIncSubmitting } } = useForm();
  const { register: regExp, handleSubmit: handleExpSubmit, reset: resetExp, formState: { isSubmitting: isExpSubmitting } } = useForm();

  useEffect(() => {
    Promise.all([
      fetch('/api/finance/receipts').then(r => r.json()),
      fetch('/api/finance/expenses').then(r => r.json()),
      fetch('/api/parties').then(r => r.json())
    ])
    .then(([recData, expData, partiesData]) => {
      setReceipts(Array.isArray(recData) ? recData : []);
      setExpenses(Array.isArray(expData) ? expData : []);
      setParties(Array.isArray(partiesData) ? partiesData : []);
      setLoading(false);
    })
    .catch(console.error);
  }, []);

  const onIncomeSubmit = async (data: any) => {
    try {
      const party = parties.find(p => p.id === data.customerId);
      const payload = {
        amount: Number(data.amount),
        customerId: data.customerId,
        customer: party ? party.name : '',
        method: data.method,
        notes: data.notes,
        date: data.date || new Date().toISOString()
      };
      const res = await fetch('/api/finance/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
      const newRec = await res.json();
      setReceipts(prev => [newRec, ...prev]);
      setIsIncomeModalOpen(false);
      resetInc();
    } catch (err) {
      console.error(err);
      alert('Failed to record income');
    }
  };

  const onExpenseSubmit = async (data: any) => {
    try {
      const payload = {
        amount: Number(data.amount),
        expenseType: data.expenseType,
        notes: data.notes,
        date: data.date || new Date().toISOString()
      };
      const res = await fetch('/api/finance/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
      const newExp = await res.json();
      setExpenses(prev => [newExp, ...prev]);
      setIsExpenseModalOpen(false);
      resetExp();
    } catch (err) {
      console.error(err);
      alert('Failed to record expense');
    }
  };

  const totalRevenue = receipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const productionCost = expenses.filter(e => e.expenseType === 'Production Cost').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  
  const grossProfit = totalRevenue - productionCost;
  const netProfit = totalRevenue - totalExpenses;

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  return (
    <div className="w-full h-full md:ml-sidebar-width p-container-padding overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="font-h1 text-h1 text-primary mb-1">Finance</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Track complete cash flow, income, and expenses.</p>
        </header>

        {/* Financial Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface-container-lowest border border-outline-variant p-5 rounded-xl shadow-sm">
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider mb-2">Total Revenue</h3>
            <div className="font-h2 text-h2 text-primary">{formatCurrency(totalRevenue)}</div>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant p-5 rounded-xl shadow-sm">
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider mb-2">Total Expenses</h3>
            <div className="font-h2 text-h2 text-error">{formatCurrency(totalExpenses)}</div>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant p-5 rounded-xl shadow-sm">
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider mb-2">Gross Profit</h3>
            <div className="font-h2 text-h2 text-on-surface">{formatCurrency(grossProfit)}</div>
            <p className="text-[11px] text-on-surface-variant mt-1">Revenue - Production Cost</p>
          </div>
          <div className={`border p-5 rounded-xl shadow-sm ${netProfit >= 0 ? 'bg-primary-container border-primary text-on-primary-container' : 'bg-error-container border-error text-on-error-container'}`}>
            <h3 className="font-label-caps text-label-caps uppercase tracking-wider mb-2 opacity-80">Net Profit</h3>
            <div className="font-h2 text-h2">{formatCurrency(netProfit)}</div>
            <p className="text-[11px] mt-1 opacity-80">Revenue - All Expenses</p>
          </div>
        </div>

        {/* Tabs and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <div className="flex gap-2">
            <button onClick={() => setTab('income')} className={`px-6 py-2 rounded-full font-body-md font-medium transition-colors ${tab === 'income' ? 'bg-primary text-on-primary' : 'bg-surface-container hover:bg-surface-container-high text-on-surface'}`}>
              Income (Receipts)
            </button>
            <button onClick={() => setTab('expenses')} className={`px-6 py-2 rounded-full font-body-md font-medium transition-colors ${tab === 'expenses' ? 'bg-error text-on-error' : 'bg-surface-container hover:bg-surface-container-high text-on-surface'}`}>
              Expenses
            </button>
          </div>
          <button 
            onClick={() => tab === 'income' ? setIsIncomeModalOpen(true) : setIsExpenseModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded bg-inverse-surface text-inverse-on-surface font-body-md font-semibold hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add {tab === 'income' ? 'Income' : 'Expense'}
          </button>
        </div>

        {/* Lists */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          {tab === 'income' ? (
            <table className="w-full text-left">
              <thead className="bg-surface-container-low text-on-surface-variant border-b border-surface-variant font-label-caps uppercase tracking-wider text-[12px]">
                <tr>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Customer</th>
                  <th className="px-6 py-4 font-semibold">Method</th>
                  <th className="px-6 py-4 font-semibold">Notes</th>
                  <th className="px-6 py-4 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant font-body-sm text-on-surface">
                {loading ? <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr> : 
                 receipts.length === 0 ? <tr><td colSpan={5} className="text-center py-8">No income recorded.</td></tr> :
                 receipts.map(r => (
                  <tr key={r.id} className="hover:bg-surface-container-low">
                    <td className="px-6 py-3">{new Date(r.date || r.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-3 font-medium">{r.customer || '—'}</td>
                    <td className="px-6 py-3 capitalize">{r.method || 'Cash'}</td>
                    <td className="px-6 py-3 text-on-surface-variant truncate max-w-xs">{r.notes || '—'}</td>
                    <td className="px-6 py-3 text-right font-data-tabular text-primary font-medium">{formatCurrency(Number(r.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-surface-container-low text-on-surface-variant border-b border-surface-variant font-label-caps uppercase tracking-wider text-[12px]">
                <tr>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Expense Type</th>
                  <th className="px-6 py-4 font-semibold">Notes</th>
                  <th className="px-6 py-4 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant font-body-sm text-on-surface">
                {loading ? <tr><td colSpan={4} className="text-center py-8">Loading...</td></tr> : 
                 expenses.length === 0 ? <tr><td colSpan={4} className="text-center py-8">No expenses recorded.</td></tr> :
                 expenses.map(e => (
                  <tr key={e.id} className="hover:bg-surface-container-low">
                    <td className="px-6 py-3">{new Date(e.date || e.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-3 font-medium">{e.expenseType || 'Misc Expense'}</td>
                    <td className="px-6 py-3 text-on-surface-variant">{e.notes || '—'}</td>
                    <td className="px-6 py-3 text-right font-data-tabular text-error font-medium">{formatCurrency(Number(e.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Income Modal */}
      {isIncomeModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-h2 text-primary">Record Income</h2>
              <button onClick={() => setIsIncomeModalOpen(false)} className="text-on-surface-variant"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleIncSubmit(onIncomeSubmit)} className="space-y-4">
              <div>
                <label className="block font-body-sm mb-1">Customer</label>
                <select {...regInc('customerId')} className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest">
                  <option value="">-- General / Walk-in --</option>
                  {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-body-sm mb-1">Amount (₹) *</label>
                <input type="number" step="0.01" min="0" {...regInc('amount', { required: true })} className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest" required />
              </div>
              <div>
                <label className="block font-body-sm mb-1">Payment Method</label>
                <select {...regInc('method')} className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest">
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block font-body-sm mb-1">Date</label>
                <input type="date" {...regInc('date')} className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest" />
              </div>
              <div>
                <label className="block font-body-sm mb-1">Notes</label>
                <textarea {...regInc('notes')} className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest" rows={2}></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsIncomeModalOpen(false)} className="px-4 py-2 text-on-surface-variant hover:bg-surface-container-low rounded">Cancel</button>
                <button type="submit" disabled={isIncSubmitting} className="px-6 py-2 bg-primary text-on-primary rounded font-medium disabled:opacity-50">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-h2 text-error">Record Expense</h2>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-on-surface-variant"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleExpSubmit(onExpenseSubmit)} className="space-y-4">
              <div>
                <label className="block font-body-sm mb-1">Expense Type *</label>
                <select {...regExp('expenseType', { required: true })} className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest" required>
                  <option value="Raw Material Purchase">Raw Material Purchase</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Rent">Rent</option>
                  <option value="Salary">Salary</option>
                  <option value="Misc Expense">Misc Expense</option>
                </select>
              </div>
              <div>
                <label className="block font-body-sm mb-1">Amount (₹) *</label>
                <input type="number" step="0.01" min="0" {...regExp('amount', { required: true })} className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest" required />
              </div>
              <div>
                <label className="block font-body-sm mb-1">Date</label>
                <input type="date" {...regExp('date')} className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest" />
              </div>
              <div>
                <label className="block font-body-sm mb-1">Notes</label>
                <textarea {...regExp('notes')} className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest" rows={2}></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="px-4 py-2 text-on-surface-variant hover:bg-surface-container-low rounded">Cancel</button>
                <button type="submit" disabled={isExpSubmitting} className="px-6 py-2 bg-error text-on-error rounded font-medium disabled:opacity-50">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
