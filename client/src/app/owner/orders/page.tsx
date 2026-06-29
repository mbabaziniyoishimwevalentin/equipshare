"use client";
import { API_BASE } from "@/lib/config";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import OwnerBottomNav from "@/components/OwnerBottomNav";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface Order {
  id: number;
  orderNumber: string;
  status: string;
  subtotal: number;
  tax: number;
  totalAmount: number;
  createdAt: string;
  payment?: { status: string };
  renter: { id: number; firstName: string; lastName: string; email: string; phone: string; address?: string };
  items: Array<{
    id: number;
    timeline: string;
    totalAmount: number;
    price: number;
    equipment: { id: number; title: string; category: string; images: string[] };
  }>;
}

// â”€â”€â”€ Status config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const STATUS_CFG: Record<string, { text: string; label: string }> = {
  PENDING:    { text: "text-[#FF5C00]",  label: "Pending"    },
  PROCESSING: { text: "text-[#c700ff]",  label: "Processing" },
  COMPLETED:  { text: "text-[#10b981]",  label: "Completed"  },
  CANCELED:   { text: "text-red-500",    label: "Canceled"   },
};

// â”€â”€â”€ Owner Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import { useRef } from "react";

const OWNER_NOTIF_KEY = "equipshare_owner_notifications";
function getOwnerUnread(): number {
  try { return (JSON.parse(localStorage.getItem(OWNER_NOTIF_KEY) || "[]") as any[]).filter((n: any) => !n.read).length; }
  catch { return 0; }
}

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

// â”€â”€â”€ Order Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function OrderCard({ order, onStatusChange }: { order: Order; onStatusChange: (id: number, status: string) => void }) {
  const router = useRouter();
  const s = STATUS_CFG[order.status] || STATUS_CFG.PENDING;
  const payStatus = order.payment?.status || "PAID";
  const firstItem = order.items?.[0];
  const renterName = `${order.renter.firstName} ${order.renter.lastName}`;
  const dateStr = new Date(order.createdAt).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  const itemsTotal = order.items?.reduce((s: number, it: any) => s + Number(it.totalAmount), 0) || 0;
  const displaySubtotal = order.subtotal || itemsTotal || order.totalAmount;
  const displayTax = order.tax || (order.subtotal ? 0 : itemsTotal * 0.18);
  const displayTotal = order.tax ? order.totalAmount : (itemsTotal + itemsTotal * 0.18);

  const handleChat = () => {
    const params = new URLSearchParams({
      orderId: String(order.id),
      orderNumber: order.orderNumber,
      renterName,
    });
    router.push(`/owner/messages?${params.toString()}`);
  };

  const handleAction = (newStatus: string) => {
    onStatusChange(order.id, newStatus);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      {/* Top row */}
      <div className="flex justify-between items-start mb-2">
        <span className="font-bold text-gray-900 text-sm">Order #{order.orderNumber}</span>
        <div className="text-right">
          <div className={`text-xs font-bold ${s.text}`}>{s.label}</div>
          <div className={`text-xs font-bold ${payStatus === "PAID" ? "text-[#10b981]" : "text-[#FF5C00]"}`}>{payStatus}</div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-[90px_1fr] gap-y-1 text-sm mb-3">
        <span className="text-gray-500">Subtotal</span>
        <span className="text-right text-gray-900 font-medium">Rwf {Number(displaySubtotal).toLocaleString()}</span>
        <span className="text-gray-500">Tax (18%)</span>
        <span className="text-right text-gray-900 font-medium">Rwf {Number(displayTax).toLocaleString()}</span>
        <span className="text-gray-500 font-bold">Total (incl. tax)</span>
        <span className="text-right text-gray-900 font-bold">Rwf {Number(displayTotal).toLocaleString()}</span>
        <span className="text-gray-500">Item</span>
        <span className="text-right text-gray-900 font-medium">{firstItem?.equipment.title || "â€”"}</span>
        <span className="text-gray-500">Customer</span>
        <span className="text-right text-gray-900 font-medium">{renterName}</span>
        <span className="text-gray-500">Location</span>
        <span className="text-right text-gray-500 text-xs">{order.renter.address || "KN 24+, Kigali"}</span>
        <span className="text-gray-500">Date</span>
        <span className="text-right text-gray-500 text-xs">{dateStr}</span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-1">
        {order.status === "PENDING" && (
          <>
            <button onClick={() => handleAction("PROCESSING")} className="flex-1 bg-[#10b981] text-white text-xs font-bold py-2.5 rounded-lg hover:bg-emerald-700 transition-colors">Accept</button>
            <button onClick={() => handleAction("CANCELED")}   className="flex-1 bg-red-600 text-white text-xs font-bold py-2.5 rounded-lg hover:bg-red-700 transition-colors">Reject</button>
            <button onClick={handleChat} className="flex-1 bg-[#0B5460] text-white text-xs font-bold py-2.5 rounded-lg hover:bg-teal-800 transition-colors">Chat</button>
          </>
        )}
        {order.status === "PROCESSING" && (
          <>
            <button onClick={() => handleAction("COMPLETED")} className="flex-1 bg-[#10b981] text-white text-xs font-bold py-2.5 rounded-lg hover:bg-emerald-700 transition-colors">Complete</button>
            <button onClick={handleChat} className="flex-1 bg-[#0B5460] text-white text-xs font-bold py-2.5 rounded-lg hover:bg-teal-800 transition-colors">Chat</button>
          </>
        )}
        {(order.status === "COMPLETED" || order.status === "CANCELED") && (
          <>
            <Link href={`/owner/orders/${order.id}`} className="flex-1 bg-[#0B215E] text-white text-xs font-bold py-2.5 rounded-lg text-center hover:bg-blue-900 transition-colors">View details</Link>
            <button onClick={handleChat} className="flex-1 bg-[#0B5460] text-white text-xs font-bold py-2.5 rounded-lg hover:bg-teal-800 transition-colors">Chat</button>
          </>
        )}
      </div>
    </div>
  );
}

// â”€â”€â”€ Orders Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function OwnerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetch(`${API_BASE}/api/orders/received`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setOrders(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [router]);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setUpdating(orderId);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      }
    } catch { /* */ }
    finally { setUpdating(null); }
  };

  const filtered = orders.filter(o =>
    o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    `${o.renter.firstName} ${o.renter.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    o.items.some(i => i.equipment.title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-24">
      <OwnerHeader />

      <div className="px-4 pt-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">My orders</h1>

        {/* Search */}
        <div className="flex gap-2 mb-5">
          <input
            type="text"
            placeholder="Search by equipment, category"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B215E]"
          />
          <button className="border border-gray-300 rounded-lg p-3 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#0B215E] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No orders found.</div>
        ) : (
          <div className="space-y-4">
            {filtered.map(order => (
              <div key={order.id} className={updating === order.id ? "opacity-60 pointer-events-none" : ""}>
                <OrderCard order={order} onStatusChange={handleStatusChange} />
              </div>
            ))}
          </div>
        )}
      </div>

      <OwnerBottomNav />
    </div>
  );
}




