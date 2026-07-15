"use client";
import { API_BASE } from "@/lib/config";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import OwnerBottomNav from "@/components/OwnerBottomNav";

// â”€â”€â”€ Status Config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const STATUS_STEPS = ["CREATED", "PENDING", "PROCESSING", "COMPLETED"] as const;
const STATUS_META: Record<string, { label: string; textColor: string; dotColor: string; lineColor: string }> = {
  CREATED:    { label: "Created",    textColor: "text-gray-700",  dotColor: "bg-gray-800",  lineColor: "bg-gray-800"  },
  PENDING:    { label: "Pending",    textColor: "text-[#FF5C00]", dotColor: "bg-[#FF5C00]", lineColor: "bg-[#FF5C00]" },
  PROCESSING: { label: "Processing", textColor: "text-[#c700ff]", dotColor: "bg-[#c700ff]", lineColor: "bg-[#c700ff]" },
  COMPLETED:  { label: "Completed",  textColor: "text-[#10b981]", dotColor: "bg-[#10b981]", lineColor: "bg-[#10b981]" },
};

// â”€â”€â”€ Copy button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={async () => { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
      className={`ml-1.5 text-xs px-1.5 py-0.5 rounded transition-colors ${copied ? "text-green-600 bg-green-50" : "text-gray-400 hover:text-gray-600"}`}>
      {copied ? "âœ“" : "Copy"}
    </button>
  );
}

// â”€â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Order Detail Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function OwnerOrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetch(`${API_BASE}/api/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setOrder).catch(console.error);
  }, [id, router]);

  const updateStatus = async (status: string) => {
    setUpdating(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE}/api/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setOrder((prev: any) => ({ ...prev, status }));
        showToast(`Order marked as ${status.toLowerCase()}`);
      }
    } catch { showToast("Failed to update status"); }
    finally { setUpdating(false); }
  };

  if (!order) return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#0B215E] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const effectiveStatus = order.status === "CANCELED" ? "PENDING" : order.status;
  const currentStepIndex = STATUS_STEPS.indexOf(effectiveStatus as any);
  const topMeta = STATUS_META[order.status] || STATUS_META.PENDING;
  const payStatus = order.payment?.status || "PAID";
  const renter = order.renter || {};
  const firstItem = order.items?.[0];
  const renterName = `${renter.firstName || ""} ${renter.lastName || ""}`.trim();
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

  const handleContactCustomer = () => {
    const params = new URLSearchParams({
      orderId: String(order.id),
      orderNumber: order.orderNumber,
      renterName,
    });
    router.push(`/owner/messages?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-24">
      <OwnerHeader />

      <div className="px-4 pt-4">
        {/* Title */}
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Order details</h1>
          <span className={`font-bold text-sm ${topMeta.textColor}`}>{topMeta.label}</span>
        </div>

        <p className="text-sm mb-1">
          <span className="font-bold text-gray-900">Order Id: </span>
          <span className="font-bold text-gray-700">#{order.orderNumber}</span>
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5 text-sm">
          <div className="space-y-1.5">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="font-medium">{`Rwf ${Number(displaySubtotal).toLocaleString()}`}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax (18%)</span>
              <span className="font-medium">{`Rwf ${Number(displayTax).toLocaleString()}`}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-200">
              <span>Total Amount (incl. tax)</span>
              <span>{`Rwf ${Number(displayTotal).toLocaleString()}`}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-gray-500">Payment Status</span>
              <span className={payStatus === "PAID" ? "font-bold text-[#10b981]" : "font-bold text-[#FF5C00]"}>{payStatus}</span>
            </div>
          </div>
        </div>

        {/* â”€â”€ Order Tracking â”€â”€ */}
        <h3 className="font-bold text-gray-900 text-sm mb-3">Order tracking</h3>
        <div className="relative mb-8 px-2">
          <div className="absolute top-[7px] left-2 right-2 h-[2px] bg-gray-200" />
          {currentStepIndex > 0 && (
            <div className={`absolute top-[7px] left-2 h-[2px] ${STATUS_META[effectiveStatus]?.lineColor || "bg-gray-400"}`}
              style={{ width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }} />
          )}
          <div className="flex justify-between relative z-10">
            {STATUS_STEPS.map((step, index) => {
              const meta = STATUS_META[step];
              const isActive = index <= currentStepIndex;
              return (
                <div key={step} className="flex flex-col items-center">
                  <div className={`w-3.5 h-3.5 rounded-full border-2 mb-1 ${isActive ? `${meta.dotColor} border-transparent` : "bg-white border-gray-300"}`} />
                  <span className={`text-[10px] font-bold ${isActive ? meta.textColor : "text-gray-400"}`}>{meta.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* â”€â”€ Item Details â”€â”€ */}
        <h2 className="text-lg font-bold text-gray-900 mb-2">Item details</h2>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm mb-5 shadow-sm">
          <div className="grid grid-cols-[120px_1fr] gap-y-2">
            <span className="font-bold text-gray-900">Product name</span>
            <span className="text-right text-gray-700">{firstItem?.equipment?.title || "â€”"}</span>
            <span className="font-bold text-gray-900">Category</span>
            <span className="text-right text-gray-700">{firstItem?.equipment?.category || "â€”"}</span>
            <span className="font-bold text-gray-900">Price:</span>
            <span className="text-right text-gray-700">{`Rwf ${Number(firstItem?.price || 0).toLocaleString()}`} /hr</span>
            <span className="font-bold text-gray-900">Qty</span>
            <span className="text-right text-gray-700">{firstItem?.quantity || 1}</span>
            <span className="font-bold text-gray-900">Timeline</span>
            <span className="text-right text-gray-700">{firstItem?.timeline || "—"}</span>
            <span className="font-bold text-gray-900">Total amount</span>
            <span className="text-right text-gray-700">{`Rwf ${Number(firstItem?.totalAmount || 0).toLocaleString()}`}</span>
          </div>
        </div>

        {/* â”€â”€ Renter Details â”€â”€ */}
        {order.securityType && (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Security Proof</h2>
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm mb-5 shadow-sm">
              <div className="grid grid-cols-[120px_1fr] gap-y-2">
                <span className="font-bold text-gray-900">Type</span>
                <span className="text-right text-gray-700">{order.securityType === "ID" ? "National ID" : "Caution Money"}</span>
                <span className="font-bold text-gray-900">Value</span>
                <span className="text-right text-gray-700">{order.securityType === "money" ? `Rwf ${Number(order.securityValue).toLocaleString()}` : order.securityValue}</span>
              </div>
            </div>
          </>
        )}

        <h2 className="text-lg font-bold text-gray-900 mb-2">Renter details</h2>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm mb-6 shadow-sm">
          <div className="grid grid-cols-[120px_1fr] gap-y-2">
            <span className="font-bold text-gray-900">Renter name</span>
            <div className="flex justify-end items-center">
              <span className="text-gray-700">{renterName}</span>
              <CopyBtn value={renterName} />
            </div>
            <span className="font-bold text-gray-900">Phone</span>
            <div className="flex justify-end items-center">
              <span className="text-gray-700">{renter.phone || "â€”"}</span>
              {renter.phone && <CopyBtn value={renter.phone} />}
            </div>
            <span className="font-bold text-gray-900">Address</span>
            <span className="text-right text-gray-700">{renter.address || "KN 24+, Kigali"}</span>
            <span className="font-bold text-gray-900">Shipping notes</span>
            <span className="text-right text-gray-500 italic text-xs">Tip will be added</span>
          </div>
        </div>

        {/* â”€â”€ Action Buttons â”€â”€ */}
        <div className="space-y-3">
          {order.payment?.status === 'PAID' && (
            <button
              onClick={async () => {
                try {
                  const token = localStorage.getItem('token');
                  const res = await fetch(`${API_BASE}/api/payments/invoice/${order.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  if (!res.ok) throw new Error('Failed to fetch invoice');
                  const blob = await res.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `invoice-order-${order.id}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  window.URL.revokeObjectURL(url);
                } catch (err) {
                  console.error(err);
                  alert('Failed to download invoice');
                }
              }}
              className="w-full bg-gray-800 text-white rounded-xl py-4 text-sm font-bold hover:opacity-90 transition-colors"
            >
              Download Invoice
            </button>
          )}
          <button onClick={handleContactCustomer}
            className="w-full bg-[#0B215E] text-white rounded-xl py-4 text-sm font-bold hover:bg-blue-900 transition-colors">
            Contact customer
          </button>
          <button onClick={handleChat}
            className="w-full bg-[#c700ff] text-white rounded-xl py-4 text-sm font-bold hover:bg-purple-700 transition-colors">
            Open Messenger
          </button>

          {/* Status actions */}
          {order.status === "PENDING" && (
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => updateStatus("PROCESSING")} disabled={updating}
                className="bg-[#10b981] text-white rounded-xl py-3.5 text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-60">
                Accept order
              </button>
              <button onClick={() => updateStatus("CANCELED")} disabled={updating}
                className="bg-red-500 text-white rounded-xl py-3.5 text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-60">
                Reject order
              </button>
            </div>
          )}
          {order.status === "PROCESSING" && (
            <button onClick={() => updateStatus("COMPLETED")} disabled={updating}
              className="w-full bg-[#10b981] text-white rounded-xl py-4 text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-60">
              Mark as Completed
            </button>
          )}

          <button onClick={() => showToast("Review feature coming soon!")}
            className="w-full bg-[#FF5C00] text-white rounded-xl py-4 text-sm font-bold hover:bg-orange-600 transition-colors">
            Review customer
          </button>
        </div>
      </div>

      <OwnerBottomNav />

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-5 py-3 rounded-full shadow-lg z-50 whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  );
}




