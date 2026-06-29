"use client";
import { API_BASE } from "@/lib/config";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface Equipment {
  id: number;
  title: string;
  category: string;
  hourlyRate: number;
  dailyRate: number;
  location: string;
  isActive: boolean;
  images: string[];
  description: string;
  createdAt: string;
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  payment?: { status: string };
  renter: { firstName: string; lastName: string; email: string; phone: string; address?: string };
  items: Array<{ id: number; timeline: string; totalAmount: number; equipment: { id: number; title: string; category: string; images: string[] } }>;
}

// â”€â”€â”€ Status helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const STATUS_CFG: Record<string, { color: string; dot: string }> = {
  PENDING:    { color: "text-[#FF5C00]",  dot: "bg-[#FF5C00]"  },
  PROCESSING: { color: "text-[#c700ff]",  dot: "bg-[#c700ff]"  },
  COMPLETED:  { color: "text-[#10b981]",  dot: "bg-[#10b981]"  },
  CANCELED:   { color: "text-red-500",    dot: "bg-red-500"    },
};

// â”€â”€â”€ Notification seeder â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const OWNER_NOTIF_KEY = "equipshare_owner_notifications";

interface OwnerNotif {
  id: string;
  type: "new_order" | "message" | "review" | "payment";
  title: string;
  body: string;
  time: string;
  read: boolean;
  linkUrl?: string;
}

function getOwnerNotifs(): OwnerNotif[] {
  try {
    const raw = localStorage.getItem(OWNER_NOTIF_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* */ }
  const base = Date.now();
  const seeded: OwnerNotif[] = [
    { id: "on1", type: "new_order",  title: "New order placed",   body: "Gasana Goreth placed a new order. Please review and accept.", time: new Date(base - 5*60000).toISOString(),   read: false, linkUrl: "/owner/orders" },
    { id: "on2", type: "new_order",  title: "New order placed",   body: "Kobusinge placed a new order for Cooking Pan. Please review.", time: new Date(base - 20*60000).toISOString(),  read: false, linkUrl: "/owner/orders" },
    { id: "on3", type: "message",    title: "New message",         body: "Gasana Goreth sent you a message: 'How far is the delivery?'", time: new Date(base - 40*60000).toISOString(),  read: false, linkUrl: "/owner/messages" },
    { id: "on4", type: "review",     title: "New review received", body: "Jonas Sousa left a 4â˜… review on your Cooking Pan equipment.", time: new Date(base - 2*3600000).toISOString(), read: true,  linkUrl: "/owner" },
    { id: "on5", type: "payment",    title: "Payment received",    body: "Payment of $164 confirmed for order #09238.", time: new Date(base - 5*3600000).toISOString(), read: true,  linkUrl: "/owner/orders" },
    { id: "on6", type: "new_order",  title: "New order placed",   body: "Diego Curumim placed a new order. Please review and accept.", time: new Date(base - 8*3600000).toISOString(), read: true,  linkUrl: "/owner/orders" },
  ];
  localStorage.setItem(OWNER_NOTIF_KEY, JSON.stringify(seeded));
  return seeded;
}

function getOwnerUnreadCount(): number {
  try {
    const notifs: OwnerNotif[] = JSON.parse(localStorage.getItem(OWNER_NOTIF_KEY) || "[]");
    return notifs.filter((n) => !n.read).length;
  } catch { return 0; }
}

// â”€â”€â”€ Mini chart (SVG area) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SalesTrendChart() {
  const pts = [20, 45, 28, 70, 35, 80, 55, 90, 40, 75, 60, 100, 45, 85];
  const w = 320; const h = 100;
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * w);
  const ys = pts.map((v) => h - (v / 100) * h);
  const linePath = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");
  const areaPath = `${linePath} L${w},${h} L0,${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c700ff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#c700ff" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#chartGrad)" />
      <path d={linePath} fill="none" stroke="#c700ff" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

// â”€â”€â”€ Owner Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function OwnerHeader({ unread }: { unread: number }) {
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

// â”€â”€â”€ Owner Bottom Nav â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function OwnerBottomNav({ active }: { active: string }) {
  const nav = [
    { href: "/owner", label: "Home", icon: (f: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" fill={f?"currentColor":"none"} viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    )},
    { href: "/owner/equipment", label: "Equipment", icon: () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    )},
    { href: "/owner/messages", label: "Messages", icon: () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    )},
    { href: "/owner/orders", label: "Orders", icon: () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    )},
    { href: "/community", label: "Community", icon: (f: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" fill={f?"currentColor":"none"} viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    )},
    { href: "/profile", label: "Profile", icon: () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )},
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 px-1 z-50 shadow-lg">
      {nav.map(({ href, label, icon }) => {
        const isActive = active === href;
        return (
          <Link key={href} href={href} className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${isActive ? (label === "Messages" ? "text-[#c700ff]" : label === "Community" ? "text-[#10b981]" : "text-[#0B215E]") : "text-gray-400"}`}>
            {icon(isActive)}
          </Link>
        );
      })}
    </div>
  );
}

// â”€â”€â”€ Summary row component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SummaryRow({ label, value, highlight }: { label: string; value: string | number; highlight?: string }) {
  return (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-bold ${highlight || "text-gray-900"}`}>{value}</span>
    </div>
  );
}

// â”€â”€â”€ Dashboard Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function OwnerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statTab, setStatTab] = useState<"Daily" | "Weekly" | "Monthly" | "Annual">("Daily");
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token || !userData) { router.push("/login"); return; }
    const parsed = JSON.parse(userData);
    if (parsed.role !== "OWNER") { router.push("/search"); return; }
    setUser(parsed);
    // init owner notifications
    getOwnerNotifs();
    setUnread(getOwnerUnreadCount());
    fetchData(token);
  }, [router]);

  const fetchData = async (token: string) => {
    try {
      const [eqRes, ordRes] = await Promise.all([
        fetch(`${API_BASE}/api/equipments/my`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/orders/received`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (eqRes.ok) setEquipments(await eqRes.json());
      if (ordRes.ok) setOrders(await ordRes.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const completed = orders.filter(o => o.status === "COMPLETED").length;
  const pending   = orders.filter(o => o.status === "PENDING").length;
  const canceled  = orders.filter(o => o.status === "CANCELED").length;
  const activeEq  = equipments.filter(e => e.isActive).length;
  const totalEarnings = orders.filter(o => o.status === "COMPLETED").reduce((s, o) => s + o.totalAmount, 0);
  const pendingEarnings = orders.filter(o => o.status === "PENDING").reduce((s, o) => s + o.totalAmount, 0);
  const taxes = totalEarnings * 0.08;
  const finalEarnings = totalEarnings - taxes;

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat"];

  if (loading) return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#0B215E] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-24">
      <OwnerHeader unread={unread} />

      <div className="px-4 pt-4 space-y-5">
        {/* Welcome */}
        <div>
          <p className="text-gray-500 text-sm">Welcome back,</p>
          <h1 className="text-2xl font-bold">
            <span className="text-gray-900">Welcome back, </span>
            <span className="text-[#c700ff]">{user?.firstName}</span>
          </h1>
        </div>

        {/* Sales Trend */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="font-bold text-gray-900 text-sm mb-3">Sales trend</p>
          <SalesTrendChart />
          <div className="flex justify-between mt-2">
            {weekdays.map(d => (
              <span key={d} className="text-[10px] text-gray-400">{d}</span>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="font-bold text-gray-900 text-sm mb-3">Order summary</p>
          {/* Tabs */}
          <div className="flex gap-4 mb-3 border-b border-gray-100 pb-2">
            {(["Daily","Weekly","Monthly","Annual"] as const).map(t => (
              <button key={t} onClick={() => setStatTab(t)}
                className={`text-xs font-semibold pb-1 border-b-2 transition-colors ${statTab === t ? "border-[#c700ff] text-[#c700ff]" : "border-transparent text-gray-400"}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="divide-y divide-gray-50">
            <SummaryRow label="New orders:" value={pending} />
            <SummaryRow label="Pending:" value={pending} />
            <SummaryRow label="Completed" value={completed} />
            <SummaryRow label="Canceled" value={canceled} />
            <SummaryRow label="Delivered" value={completed} />
          </div>
        </div>

        {/* Equipment Summary */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="font-bold text-gray-900 text-sm mb-3">Equipment summary</p>
          <div className="divide-y divide-gray-50">
            <SummaryRow label="Total equipments" value={equipments.length} />
            <SummaryRow label="Top selling:" value={Math.min(2, equipments.length)} />
            <SummaryRow label="Active" value={activeEq} />
            <SummaryRow label="Suspended" value={0} />
            <SummaryRow label="Inactive" value={equipments.length - activeEq} />
          </div>
        </div>

        {/* Sales Overview */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="font-bold text-gray-900 text-sm mb-3">Sales Overview</p>
          <div className="divide-y divide-gray-50">
            <SummaryRow label="Total Earnings" value={`Rwf ${totalEarnings.toFixed(2)}`} highlight="font-extrabold text-gray-900" />
            <SummaryRow label="Taxes & fees" value={`Rwf ${taxes.toFixed(1)}`} />
            <SummaryRow label="Final Earnings" value={`Rwf ${finalEarnings.toFixed(1)}`} highlight="font-extrabold text-gray-900" />
            <SummaryRow label="Pending" value={`Rwf ${pendingEarnings}`} highlight="text-[#FF5C00]" />
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <p className="font-bold text-gray-900 text-sm mb-3">Quick Actions</p>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/owner/orders" className="bg-[#0B215E] text-white text-sm font-bold py-3.5 rounded-xl text-center hover:bg-blue-900 transition-colors">View orders</Link>
            <Link href="/owner/equipment" className="bg-[#10b981] text-white text-sm font-bold py-3.5 rounded-xl text-center hover:bg-emerald-700 transition-colors">Add equipment</Link>
            <Link href="/owner/messages" className="bg-[#1a7a5e] text-white text-sm font-bold py-3.5 rounded-xl text-center hover:bg-emerald-800 transition-colors">Messenger</Link>
            <Link href="/community" className="bg-[#FF5C00] text-white text-sm font-bold py-3.5 rounded-xl text-center hover:bg-orange-600 transition-colors">Community</Link>
            <Link href="/profile" className="bg-[#10b981] text-white text-sm font-bold py-3.5 rounded-xl text-center hover:bg-emerald-700 transition-colors">Profile</Link>
            <button onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); router.push("/login"); }}
              className="bg-red-500 text-white text-sm font-bold py-3.5 rounded-xl text-center hover:bg-red-600 transition-colors">Log out</button>
          </div>
        </div>
      </div>

      <OwnerBottomNav active="/owner" />
    </div>
  );
}



