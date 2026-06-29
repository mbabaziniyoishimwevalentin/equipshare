"use client";
import { API_BASE } from "@/lib/config";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import OwnerBottomNav from "@/components/OwnerBottomNav";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface Equipment {
  id: number;
  title: string;
  category: string;
  hourlyRate: number;
  dailyRate: number;
  description: string;
  location: string;
  isActive: boolean;
  images: string[];
  createdAt: string;
}

// â”€â”€â”€ Notification helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const OWNER_NOTIF_KEY = "equipshare_owner_notifications";
function getOwnerUnread(): number {
  try { return (JSON.parse(localStorage.getItem(OWNER_NOTIF_KEY) || "[]") as any[]).filter((n: any) => !n.read).length; }
  catch { return 0; }
}

// â”€â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function OwnerHeader() {
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    setUnread(getOwnerUnread());
    const id = setInterval(() => setUnread(getOwnerUnread()), 3000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex justify-between items-center px-4 py-4 bg-white sticky top-0 z-50 border-b border-gray-100">
      <h1 className="text-xl font-bold text-[#0B215E]">EQUIPSHARE</h1>
      <Link href="/owner/notifications" className="relative text-gray-700">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Link>
    </div>
  );
}

// â”€â”€â”€ Add / Edit Equipment Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface EquipmentFormProps {
  initial?: Equipment | null;
  onClose: () => void;
  onSaved: (eq: Equipment) => void;
  token: string;
}

function EquipmentFormModal({ initial, onClose, onSaved, token }: EquipmentFormProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const isEdit = !!initial;

  const [form, setForm] = useState({
    title: initial?.title || "",
    category: initial?.category || "",
    hourlyRate: initial?.hourlyRate ?? "",
    dailyRate: initial?.dailyRate ?? "",
    location: initial?.location || "",
    description: initial?.description || "",
    isActive: initial?.isActive ?? true,
  });
  const [images, setImages] = useState<string[]>(initial?.images || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImages((prev) => [...prev, reader.result as string]);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.title || !form.category || !form.hourlyRate) {
      setError("Title, category and hourly rate are required.");
      return;
    }
    setSaving(true);
    const body = { ...form, hourlyRate: Number(form.hourlyRate), dailyRate: Number(form.dailyRate) || 0, images };
    try {
      const url  = isEdit ? `${API_BASE}/api/equipments/${initial!.id}` : `${API_BASE}/api/equipments`;
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed to save."); return; }
      const saved = await res.json();
      onSaved(saved);
      onClose();
    } catch { setError("Network error."); }
    finally { setSaving(false); }
  };

  const CATEGORIES = ["Construction", "Agriculture", "Transport", "Kitchen", "Electronics", "Pans", "Tools", "Other"];

  return (
    <div ref={overlayRef} onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-lg rounded-t-2xl px-5 pt-5 pb-10 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-gray-900">{isEdit ? "Edit equipment" : "Add new equipment"}</h2>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center border border-gray-300 rounded-md text-gray-600 font-bold text-sm hover:bg-gray-50">X</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          {/* Image upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Images</label>
            <div className="flex gap-2 flex-wrap">
              {images.map((src, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                    className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center">âœ•</button>
                </div>
              ))}
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-[#0B215E] hover:text-[#0B215E] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>
          </div>

          {[
            { label: "Title", key: "title", type: "text", placeholder: "e.g. Cooking Pan" },
            { label: "Location", key: "location", type: "text", placeholder: "e.g. KN 24+, Kigali" },
            { label: "Hourly Rate (Rwf)", key: "hourlyRate", type: "number", placeholder: "14" },
            { label: "Daily Rate (Rwf)", key: "dailyRate", type: "number", placeholder: "80" },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
              <input type={type} placeholder={placeholder} value={(form as any)[key]}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#0B215E]" />
            </div>
          ))}

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
            <div className="relative">
              <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 appearance-none focus:outline-none focus:ring-1 focus:ring-[#0B215E]">
                <option value="" className="text-gray-900">Select category</option>
                {CATEGORIES.map((c) => <option key={c} value={c} className="text-gray-900">{c}</option>)}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea rows={3} placeholder="Short description of your equipment..." value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#0B215E] resize-none" />
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Active listing</span>
            <button type="button" onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? "bg-[#10b981]" : "bg-gray-300"}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.isActive ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          <button type="submit" disabled={saving}
            className="w-full bg-[#0B215E] text-white py-4 rounded-xl font-bold text-sm hover:bg-blue-900 transition-colors disabled:opacity-60">
            {saving ? "Savingâ€¦" : isEdit ? "Save changes" : "Add equipment"}
          </button>
        </form>
      </div>
    </div>
  );
}

// â”€â”€â”€ Delete confirm modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function DeleteModal({ eq, onClose, onConfirm }: { eq: Equipment; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete equipment?</h3>
        <p className="text-sm text-gray-500 mb-5">
          Are you sure you want to delete <span className="font-semibold text-gray-900">"{eq.title}"</span>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 bg-red-500 text-white py-3 rounded-xl text-sm font-bold hover:bg-red-600 transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Equipment Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function EquipmentCard({
  eq,
  onEdit,
  onDelete,
}: {
  eq: Equipment;
  onEdit: (eq: Equipment) => void;
  onDelete: (eq: Equipment) => void;
}) {
  const img = eq.images?.[0];
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 flex gap-3 shadow-sm">
      {/* Thumbnail */}
      <div className="w-20 h-20 rounded-lg bg-gray-100 shrink-0 overflow-hidden">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={eq.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 text-sm">
        <div className="flex flex-wrap gap-2 items-center mb-1">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${eq.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
            {eq.isActive ? "Available" : "Unavailable"}
          </span>
        </div>
        <p className="text-gray-600">Hourly: <span className="font-semibold text-gray-900">Rwf {Number(eq.hourlyRate).toLocaleString()}</span></p>
        <p className="text-gray-600">Daily: <span className="text-gray-700">Rwf {(eq.dailyRate || eq.hourlyRate * 8).toLocaleString()}</span></p>
        <p className="text-gray-600">Category: <span className="text-gray-700">{eq.category}</span></p>
        <p className="text-gray-500 text-xs truncate">Description: {eq.description || "â€”"}</p>
        <div className="flex justify-end gap-3 mt-1.5">
          <button onClick={() => onDelete(eq)} className="text-red-500 hover:text-red-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
          <button onClick={() => onEdit(eq)} className="text-[#0B215E] hover:text-blue-900 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Equipment Listing Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function OwnerEquipmentPage() {
  const router = useRouter();
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Equipment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Equipment | null>(null);
  const [token, setToken] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  useEffect(() => {
    const t = localStorage.getItem("token") || "";
    if (!t) { router.push("/login"); return; }
    setToken(t);
    fetch(`${API_BASE}/api/equipments/my`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json()).then(d => { setEquipments(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [router]);

  const handleSaved = (saved: Equipment) => {
    setEquipments(prev => {
      const exists = prev.find(e => e.id === saved.id);
      if (exists) return prev.map(e => e.id === saved.id ? saved : e);
      return [saved, ...prev];
    });
    showToast(editTarget ? "Equipment updated!" : "Equipment added!");
    setEditTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`${API_BASE}/api/equipments/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setEquipments(prev => prev.filter(e => e.id !== deleteTarget.id));
      showToast("Equipment deleted.");
    } catch { showToast("Failed to delete."); }
    setDeleteTarget(null);
  };

  const filtered = equipments.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-24">
      <OwnerHeader />

      <div className="px-4 pt-4">
        {/* Title row */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Equipment listing</h1>
          <button onClick={() => { setEditTarget(null); setShowForm(true); }}
            className="bg-[#0B215E] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors">
            Add New
          </button>
        </div>

        {/* Search */}
        <div className="flex gap-2 mb-5">
          <input type="text" placeholder="Search by equipment, category" value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#0B215E] bg-white" />
          <button className="border border-gray-300 rounded-lg p-3 text-gray-500 bg-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#0B215E] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-3 text-gray-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            <p className="text-gray-500 text-sm font-medium">
              {search ? "No equipment matches your search." : "No equipment listed yet. Tap 'Add New' to get started."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(eq => (
              <EquipmentCard key={eq.id} eq={eq}
                onEdit={(e) => { setEditTarget(e); setShowForm(true); }}
                onDelete={(e) => setDeleteTarget(e)} />
            ))}
          </div>
        )}
      </div>

      <OwnerBottomNav />

      {/* Add / Edit modal */}
      {showForm && (
        <EquipmentFormModal
          initial={editTarget}
          token={token}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <DeleteModal
          eq={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-5 py-3 rounded-full shadow-lg z-50 whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  );
}




