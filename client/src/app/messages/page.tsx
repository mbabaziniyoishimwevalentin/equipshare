"use client";

import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

import { API } from "@/lib/config";

// ─── Types ────────────────────────────────────────────────────────
interface ApiMessage {
  id: number;
  body: string;
  createdAt: string;
  sender: { id: number; firstName: string; lastName: string; role: string };
}

interface Conversation {
  orderId: number;
  orderNumber: string;
  otherName: string;    // owner name
  otherOnline: boolean;
  messages: ApiMessage[];
}

// ─── Helpers ──────────────────────────────────────────────────────
const fmt = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

// ─── Bubble ───────────────────────────────────────────────────────
function Bubble({ msg, myId }: { msg: ApiMessage; myId: number }) {
  const isMe = msg.sender?.id === myId;
  return (
    <div className={`flex mb-4 ${isMe ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[72%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
        isMe ? "bg-[#0B5460] text-white rounded-br-none"
              : "bg-white border border-[#c700ff]/30 text-gray-900 rounded-bl-none"
      }`}>
        <p>{msg.body}</p>
        <p className={`text-[10px] mt-1 text-right ${isMe ? "text-teal-200" : "text-gray-400"}`}>
          {fmt(msg.createdAt)}
        </p>
      </div>
    </div>
  );
}

// ─── Chat View ────────────────────────────────────────────────────
function ChatView({ conv, myId, onBack, onSend }: {
  conv: Conversation;
  myId: number;
  onBack: () => void;
  onSend: (text: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [conv.messages]);

  const send = () => { const t = draft.trim(); if (!t) return; onSend(t); setDraft(""); };

  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 128px)" }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="text-gray-500 p-1">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0B215E] to-[#c700ff] flex items-center justify-center text-white font-bold text-sm shrink-0">
          {conv.otherName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm">{conv.otherName}</p>
          <p className="text-xs text-gray-400">Order {conv.orderNumber}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs font-bold text-green-500">Online</span>
        </div>
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-[#F5F5F5]">
        {conv.messages.map(m => <Bubble key={m.id} msg={m} myId={myId} />)}
        <div ref={bottomRef} />
      </div>
      {/* Input */}
      <div className="bg-[#E8E8E8] px-3 py-3 flex items-center gap-2 shrink-0">
        <input type="text" value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Type message"
          className="flex-1 bg-white rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B215E]/30 text-gray-800 placeholder:text-gray-400" />
        <button onClick={send} disabled={!draft.trim()}
          className="text-[#0B215E] hover:text-[#c700ff] transition-colors disabled:opacity-40">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Conversation List ────────────────────────────────────────────
function ConvList({ convs, onSelect }: { convs: Conversation[]; onSelect: (c: Conversation) => void }) {
  if (convs.length === 0) return (
    <div className="text-center py-16 px-6 text-gray-400 text-sm">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-3 text-gray-300">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
      No conversations yet.<br />
      <span className="text-xs">Contact an equipment owner from an order to start chatting.</span>
    </div>
  );
  return (
    <div className="divide-y divide-gray-100">
      {convs.map(conv => {
        const last = conv.messages[conv.messages.length - 1];
        return (
          <button key={conv.orderId} onClick={() => onSelect(conv)}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors text-left">
            <div className="w-11 h-11 rounded-full bg-[#0B215E] flex items-center justify-center text-white font-bold text-sm shrink-0">
              {conv.otherName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900 text-sm">{conv.otherName}</span>
                <span className="text-[10px] text-gray-400">{last ? fmt(last.createdAt) : ""}</span>
              </div>
              <p className="text-xs text-gray-500 truncate">Order {conv.orderNumber} · {last?.body || ""}</p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
          </button>
        );
      })}
    </div>
  );
}

// ─── Inner (uses useSearchParams) ────────────────────────────────
function MessagesInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [myId, setMyId] = useState(0);
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const getHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
    return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  };

  // Build a conversation object from an order API response
  const buildConv = useCallback((order: any): Conversation => {
    const owner = order.items?.[0]?.equipment?.owner;
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      otherName: owner ? `${owner.firstName} ${owner.lastName}` : "Owner",
      otherOnline: true,
      messages: order.messages || [],
    };
  }, []);

  // Load conversations from API
  const loadConvs = useCallback(async () => {
    try {
      const res = await fetch(`${API}/messages/conversations`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setConvs(data.map(buildConv));
      }
    } catch { /* ignore */ }
  }, [buildConv]);

  // Load messages for active conversation
  const loadMessages = useCallback(async (orderId: number) => {
    try {
      const res = await fetch(`${API}/messages/${orderId}`, { headers: getHeaders() });
      if (res.ok) {
        const msgs = await res.json();
        setActive(prev => prev ? { ...prev, messages: msgs } : prev);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setMyId(JSON.parse(userData).id);

    const orderId     = searchParams.get("orderId");
    const orderNumber = searchParams.get("orderNumber");
    const ownerName   = searchParams.get("ownerName");

    // If deep-linked from order details: open that chat and send greeting
    if (orderId && orderNumber && ownerName) {
      const conv: Conversation = {
        orderId: Number(orderId),
        orderNumber,
        otherName: ownerName,
        otherOnline: true,
        messages: [],
      };
      setActive(conv);
      loadMessages(Number(orderId));
      loadConvs();
    } else {
      loadConvs().then(() => setLoading(false));
    }

    setLoading(false);
  }, [searchParams, loadConvs, loadMessages]);

  // Poll for new messages when chat is open (every 4s)
  useEffect(() => {
    if (active) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => loadMessages(active.orderId), 4000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [active?.orderId, loadMessages]);

  const handleSend = async (text: string) => {
    if (!active) return;
    // Optimistic update
    const tempMsg: ApiMessage = {
      id: Date.now(),
      body: text,
      createdAt: new Date().toISOString(),
      sender: { id: myId, firstName: "Me", lastName: "", role: "RENTER" },
    };
    setActive(prev => prev ? { ...prev, messages: [...prev.messages, tempMsg] } : prev);

    try {
      const res = await fetch(`${API}/messages/${active.orderId}`, {
        method: "POST", headers: getHeaders(), body: JSON.stringify({ body: text }),
      });
      if (res.ok) {
        // Refresh to get server-confirmed message
        await loadMessages(active.orderId);
      }
    } catch { /* ignore */ }
  };

  return (
    <>
      {active ? (
        <ChatView conv={active} myId={myId} onBack={() => { setActive(null); loadConvs(); }} onSend={handleSend} />
      ) : (
        <div className="flex-1">
          <div className="px-4 pt-4 pb-2 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900">Messenger</h1>
            <p className="text-xs text-gray-400 mt-0.5">Conversations with equipment owners</p>
          </div>
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-[#0B215E] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <ConvList convs={convs} onSelect={setActive} />
          )}
        </div>
      )}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────
export default function MessagesPage() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col">
      <Header />
      <Suspense fallback={<div className="flex-1 flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-[#0B215E] border-t-transparent rounded-full animate-spin" /></div>}>
        <MessagesInner />
      </Suspense>
      <BottomNav />
    </div>
  );
}

