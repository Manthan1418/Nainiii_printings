"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";

type PartyType = "customer" | "supplier" | "both";

interface Party {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  type: PartyType;
  gstin: string;
  notes: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  address: "",
  type: "customer" as PartyType,
  gstin: "",
  notes: "",
  latitude: undefined as number | undefined,
  longitude: undefined as number | undefined,
};

const TYPE_BADGE: Record<PartyType, { label: string; classes: string }> = {
  customer: { label: "Customer", classes: "bg-secondary-container text-on-secondary-container" },
  supplier: { label: "Supplier", classes: "bg-tertiary-container text-on-tertiary" },
  both: { label: "Both", classes: "bg-primary-container text-on-primary-container" },
};

export default function PartiesPage() {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | PartyType>("all");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editParty, setEditParty] = useState<Party | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const firstInputRef = useRef<HTMLInputElement>(null);

  async function fetchParties() {
    setLoading(true);
    try {
      const res = await fetch("/api/parties");
      const data = await res.json();
      setParties(Array.isArray(data) ? data : []);
    } catch {
      setParties([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchParties();
  }, []);

  function openAdd() {
    setEditParty(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
    setTimeout(() => firstInputRef.current?.focus(), 100);
  }

  function openEdit(p: Party) {
    setEditParty(p);
    setForm({ name: p.name, phone: p.phone, email: p.email, address: p.address, type: p.type, gstin: p.gstin, notes: p.notes, latitude: p.latitude, longitude: p.longitude });
    setFormError("");
    setModalOpen(true);
    setTimeout(() => firstInputRef.current?.focus(), 100);
  }

  function closeModal() {
    setModalOpen(false);
    setEditParty(null);
    setFormError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setFormError("Party name is required."); return; }
    setSaving(true);
    setFormError("");
    try {
      const method = editParty ? "PATCH" : "POST";
      const url = editParty ? `/api/parties/${editParty.id}` : "/api/parties";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }
      await fetchParties();
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
      await fetch(`/api/parties/${id}`, { method: "DELETE" });
      setParties(prev => prev.filter(p => p.id !== id));
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  }

  const filtered = parties.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search) ||
      p.email.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || p.type === filterType;
    return matchSearch && matchType;
  });

  const counts = {
    all: parties.length,
    customer: parties.filter(p => p.type === "customer").length,
    supplier: parties.filter(p => p.type === "supplier").length,
    both: parties.filter(p => p.type === "both").length,
  };

  return (
    <main className="flex-1 md:ml-sidebar-width p-container-padding overflow-y-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-h1 text-h1 text-primary">Parties</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">
            Manage customers, suppliers, and trading partners.
          </p>
        </div>
        <button
          id="add-party-btn"
          onClick={openAdd}
          className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-DEFAULT font-body-md hover:bg-inverse-surface active:scale-[0.98] transition-all self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Add Party
        </button>
      </div>

      {/* Filter Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Type Tabs */}
        <div className="flex gap-1 bg-surface-container-low p-1 rounded-lg border border-surface-variant flex-wrap">
          {(["all", "customer", "supplier", "both"] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded text-body-sm font-semibold capitalize transition-all ${
                filterType === t
                  ? "bg-surface-container-lowest text-primary shadow-sm border border-outline-variant/50"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
              <span className="ml-1.5 text-[10px] opacity-70">({counts[t]})</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
          <input
            type="text"
            placeholder="Search name, phone, email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-body-md text-primary placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl ambient-shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-variant bg-surface-bright flex items-center justify-between">
          <h3 className="font-h3 text-h3 text-primary">Party Directory</h3>
          <span className="text-body-sm text-on-surface-variant">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low font-data-tabular text-data-tabular text-on-surface-variant border-b border-surface-variant">
              <tr>
                <th className="py-3 px-6 font-medium">Name</th>
                <th className="py-3 px-6 font-medium">Type</th>
                <th className="py-3 px-6 font-medium hidden sm:table-cell">Phone</th>
                <th className="py-3 px-6 font-medium hidden md:table-cell">Email</th>
                <th className="py-3 px-6 font-medium hidden lg:table-cell">GSTIN</th>
                <th className="py-3 px-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm text-on-surface divide-y divide-surface-variant">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined animate-spin text-[28px]">progress_activity</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-[36px] text-outline">group</span>
                      <p>No parties found. <button onClick={openAdd} className="text-primary underline">Add one now.</button></p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(p => {
                  const badge = TYPE_BADGE[p.type] || TYPE_BADGE.customer;
                  return (
                    <tr key={p.id} className="hover:bg-surface-container-low transition-colors group">
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {p.name[0]?.toUpperCase()}
                          </div>
                          <div>
                            <Link href={`/parties/${p.id}`} className="font-semibold text-on-surface hover:underline hover:text-primary transition-colors">{p.name}</Link>
                            {p.address && <div className="text-on-surface-variant text-[11px] truncate max-w-[160px]">{p.address}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-6">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${badge.classes}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-6 hidden sm:table-cell text-on-surface-variant">{p.phone || "—"}</td>
                      <td className="py-3 px-6 hidden md:table-cell text-on-surface-variant truncate max-w-[180px]">{p.email || "—"}</td>
                      <td className="py-3 px-6 hidden lg:table-cell font-mono text-on-surface-variant text-[11px]">{p.gstin || "—"}</td>
                      <td className="py-3 px-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(p)}
                            title="Edit"
                            className="p-1.5 rounded hover:bg-surface-container-highest text-on-surface-variant hover:text-primary transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            onClick={() => setDeleteId(p.id)}
                            title="Delete"
                            className="p-1.5 rounded hover:bg-error-container text-on-surface-variant hover:text-error transition-colors"
                          >
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
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
              <h2 className="font-h3 text-h3 text-primary">
                {editParty ? "Edit Party" : "Add New Party"}
              </h2>
              <button onClick={closeModal} className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-error-container text-error text-body-sm rounded p-3">{formError}</div>
              )}

              {/* Name */}
              <div>
                <label className="block font-body-sm text-body-sm text-on-surface-variant mb-1.5" htmlFor="party-name">
                  Party Name <span className="text-error">*</span>
                </label>
                <input
                  id="party-name"
                  ref={firstInputRef}
                  type="text"
                  required
                  placeholder="e.g. Sharma Traders"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-body-md text-primary placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block font-body-sm text-body-sm text-on-surface-variant mb-1.5">
                  Party Type
                </label>
                <div className="flex gap-2">
                  {(["customer", "supplier", "both"] as PartyType[]).map(t => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={`flex-1 py-2 rounded border text-body-sm font-semibold capitalize transition-all ${
                        form.type === t
                          ? "bg-primary text-on-primary border-primary"
                          : "border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-body-sm text-body-sm text-on-surface-variant mb-1.5" htmlFor="party-phone">Phone</label>
                  <input
                    id="party-phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-body-md text-primary placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
                  />
                </div>
                <div>
                  <label className="block font-body-sm text-body-sm text-on-surface-variant mb-1.5" htmlFor="party-email">Email</label>
                  <input
                    id="party-email"
                    type="email"
                    placeholder="party@example.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-body-md text-primary placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-body-sm text-body-sm text-on-surface-variant" htmlFor="party-address">Address</label>
                  <button 
                    type="button" 
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(async (position) => {
                          const lat = position.coords.latitude;
                          const lng = position.coords.longitude;
                          setForm(f => ({ ...f, latitude: lat, longitude: lng }));
                          
                          // Optional: reverse geocoding
                          try {
                            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
                            const data = await res.json();
                            if (data && data.display_name) {
                              setForm(f => ({ ...f, address: data.display_name }));
                            }
                          } catch (e) {
                            console.error("Geocoding failed", e);
                          }
                        }, (error) => {
                          alert("Failed to get location: " + error.message);
                        });
                      } else {
                        alert("Geolocation is not supported by this browser.");
                      }
                    }}
                    className="text-primary text-[11px] font-semibold hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">my_location</span>
                    Use Current Location
                  </button>
                </div>
                <textarea
                  id="party-address"
                  rows={2}
                  placeholder="Shop / Building, City, State"
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-body-md text-primary placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow resize-none"
                />
                {form.latitude && form.longitude && (
                  <div className="text-[10px] text-on-surface-variant mt-1">
                    GPS: {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}
                  </div>
                )}
              </div>

              {/* GSTIN */}
              <div>
                <label className="block font-body-sm text-body-sm text-on-surface-variant mb-1.5" htmlFor="party-gstin">GSTIN</label>
                <input
                  id="party-gstin"
                  type="text"
                  maxLength={15}
                  placeholder="22AAAAA0000A1Z5"
                  value={form.gstin}
                  onChange={e => setForm(f => ({ ...f, gstin: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded font-mono text-body-md text-primary placeholder:text-outline placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow tracking-widest"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block font-body-sm text-body-sm text-on-surface-variant mb-1.5" htmlFor="party-notes">Notes</label>
                <textarea
                  id="party-notes"
                  rows={2}
                  placeholder="Any additional info…"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-body-md text-primary placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow resize-none"
                />
              </div>

              {/* Footer Buttons */}
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
                  {saving ? "Saving…" : editParty ? "Update Party" : "Add Party"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-error text-[28px]">delete_forever</span>
              <h2 className="font-h3 text-h3 text-primary">Delete Party?</h2>
            </div>
            <p className="text-body-md text-on-surface-variant mb-6">
              This action cannot be undone. The party will be permanently removed.
            </p>
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
