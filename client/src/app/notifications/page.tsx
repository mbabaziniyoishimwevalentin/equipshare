"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

import { API } from "@/lib/config";

type NotifType = "message" | "new_equipment" | "delivery" | "order_update" | "review" | "payment" | "new_order" | "meetup" | "event" | "tip" | "suggestion";

interface Notification {
  id: number;
  type: NotifType;
  title: string;
  body: string;
  read: boolean;
  linkUrl?: string;
  createdAt: string;
}

type Tab = "all" | "read" | "unread";

function NotifIcon({ type }: { type: NotifType }) {
  const cfgs: Record<string, { bg: string; stroke: string }> = {
    message:      { bg: "bg-[#c700ff]/10", stroke: "#c700ff" },
    new_order:    { bg: "bg-[#FF5C00]/10", stroke: "#FF5C00" },
    order_update: { bg: "bg-[#10b981]/10", stroke: "#10b981" },
    delivery:     { bg: "bg-[#FF5C00]/10", stroke: "#FF5C00" },
    new_equipment:{ bg: "bg-[#0B215E]/10", stroke: "#0B215E" },
    payment:      { bg: "bg-blue-500/10",  stroke: "#3B82F6" },
    review:       { bg: "bg-yellow-400/10",stroke: "#FBBF24" },
    meetup:       { bg: "bg-[#FF5C00]/10", stroke: "#FF5C00" },
    event:        { bg: "bg-[#c700ff]/10", stroke: "#c700ff" },
    tip:          { bg: "bg-[#10b981]/10", stroke: "#10b981" },
    suggestion:   { bg: "bg-[#0B5460]/10", stroke: "#0B5460" },
  };
  const { bg, stroke } = cfgs[type] || cfgs.order_update;
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke={stroke} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    </div>
  );
}

function timeLabel(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const t = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  if (mins < 1440) return `Today, ${t}`;
  return `Yesterday, ${t}`;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [tab, setTab] = useState<Tab>("all");
  const [loading, setLoading] = useState(true);

  const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token") || ""}` });

  const load = async () => {
    try {
      const res = await fetch(`${API}/notifications`, { headers: headers() });
      if (res.ok) setNotifs(await res.json());
    } catch { /* */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleMarkAllRead = async () => {
    await fetch(`${API}/notifications/read-all`, { method: "PATCH", headers: headers() });
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClick = async (n: Notification) => {
    if (!n.read) {
      await fetch(`${API}/notifications/${n.id}/read`, { method: "PATCH", headers: headers() });
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
    }
    if (n.linkUrl) router.push(n.linkUrl);
  };

  const filtered = notifs.filter(n => tab === "all" ? true : tab === "read" ? n.read : !n.read);
  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-24">
      <Header />
      <div className="px-4 pt-4">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && <span className="bg-[#c700ff] text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>}
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="text-xs text-[#0B215E] font-semibold hover:underline">Mark all read</button>
          )}
        </div>

        <div className="flex gap-6 border-b border-gray-200 mb-4 mt-3">
          {(["all","read","unread"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`pb-2 text-sm font-semibold border-b-2 capitalize transition-colors ${tab === t ? "border-[#c700ff] text-[#c700ff]" : "border-transparent text-gray-500"}`}>
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-[#0B215E] border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-3 text-gray-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            {tab === "unread" ? "No unread notifications." : "No notifications yet."}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(n => (
              <div key={n.id} onClick={() => handleClick(n)}
                className={`rounded-xl p-4 flex gap-3 cursor-pointer transition-all ${n.read ? "bg-white" : "bg-[#F0F4FF] border-l-4 border-[#0B215E]"}`}>
                <NotifIcon type={n.type as NotifType} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-1">
                    <p className={`text-sm leading-tight ${n.read ? "font-semibold" : "font-bold"} text-gray-900`}>{n.title}</p>
                    {!n.read && <span className="w-2.5 h-2.5 rounded-full bg-[#c700ff] shrink-0 mt-1" />}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">{n.body}</p>
                  <div className="flex items-center justify-between mt-2">
                    {n.linkUrl && <span className="text-xs text-[#0B215E] font-semibold">View</span>}
                    <span className="text-[10px] text-[#c700ff] font-medium ml-auto">{timeLabel(n.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

