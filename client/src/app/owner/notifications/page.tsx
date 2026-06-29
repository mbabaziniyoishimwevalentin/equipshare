"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import OwnerBottomNav from "@/components/OwnerBottomNav";

import { API } from "@/lib/config";

type NotifType = "new_order" | "message" | "review" | "payment" | "order_update" | "meetup" | "event" | "tip" | "suggestion";

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
  const cfgs: Record<string, { bg: string; path: string; stroke: string }> = {
    new_order:    { bg: "bg-[#FF5C00]/10", stroke: "#FF5C00", path: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" },
    message:      { bg: "bg-[#c700ff]/10", stroke: "#c700ff", path: "M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" },
    review:       { bg: "bg-yellow-400/10", stroke: "#FBBF24", path: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" },
    payment:      { bg: "bg-[#10b981]/10", stroke: "#10b981", path: "M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" },
    order_update: { bg: "bg-[#10b981]/10", stroke: "#10b981", path: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    meetup:       { bg: "bg-[#FF5C00]/10", stroke: "#FF5C00", path: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" },
    event:        { bg: "bg-[#c700ff]/10", stroke: "#c700ff", path: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" },
    tip:          { bg: "bg-[#10b981]/10", stroke: "#10b981", path: "M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" },
    suggestion:   { bg: "bg-[#0B5460]/10", stroke: "#0B5460", path: "M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" },
  };
  const c = cfgs[type] || cfgs.order_update;
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${c.bg}`}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke={c.stroke} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d={c.path} />
      </svg>
    </div>
  );
}

function timeLabel(iso: string) {
  const d = new Date(iso);
  const t = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const diffH = (Date.now() - d.getTime()) / 3600000;
  return diffH < 24 ? `Today, ${t}` : `Yesterday, ${t}`;
}

export default function OwnerNotificationsPage() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [tab, setTab] = useState<Tab>("all");
  const [loading, setLoading] = useState(true);

  const hdrs = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token") || ""}` });

  const load = async () => {
    try {
      const res = await fetch(`${API}/notifications`, { headers: hdrs() });
      if (res.ok) setNotifs(await res.json());
    } catch { /* */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const markAllRead = async () => {
    await fetch(`${API}/notifications/read-all`, { method: "PATCH", headers: hdrs() });
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClick = async (n: Notification) => {
    if (!n.read) {
      await fetch(`${API}/notifications/${n.id}/read`, { method: "PATCH", headers: hdrs() });
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
    }
    if (n.linkUrl) router.push(n.linkUrl);
  };

  const filtered = notifs.filter(n => tab === "all" ? true : tab === "read" ? n.read : !n.read);
  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-24">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-4 bg-white sticky top-0 z-50 border-b border-gray-100">
        <h1 className="text-xl font-bold text-[#0B215E]">EQUIPSHARE</h1>
        <div className="relative text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          {unreadCount > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{unreadCount}</span>}
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && <span className="bg-[#FF5C00] text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>}
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && <button onClick={markAllRead} className="text-xs text-[#0B215E] font-semibold hover:underline">Mark all read</button>}
            <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md text-gray-600 font-bold text-xs hover:bg-gray-50">X</button>
          </div>
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
                className={`rounded-xl p-4 flex gap-3 cursor-pointer transition-all ${n.read ? "bg-white" : "bg-[#FFF5F0] border-l-4 border-[#FF5C00]"}`}>
                <NotifIcon type={n.type as NotifType} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-1">
                    <p className={`text-sm leading-tight ${n.read ? "font-semibold" : "font-bold"} text-gray-900`}>{n.title}</p>
                    {!n.read && <span className="w-2.5 h-2.5 rounded-full bg-[#FF5C00] shrink-0 mt-1" />}
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
      <OwnerBottomNav />
    </div>
  );
}

