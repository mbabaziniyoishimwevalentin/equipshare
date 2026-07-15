"use client";
import { API_BASE } from "@/lib/config";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

// â”€â”€â”€ Status config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const STATUS_STEPS = ["CREATED", "PENDING", "PROCESSING", "COMPLETED"] as const;

const STATUS_META: Record<
  string,
  { label: string; textColor: string; dotColor: string; lineColor: string }
> = {
  CREATED:    { label: "Created",    textColor: "text-gray-700",  dotColor: "bg-gray-800",   lineColor: "bg-gray-800"   },
  PENDING:    { label: "Pending",    textColor: "text-[#FF5C00]", dotColor: "bg-[#FF5C00]",  lineColor: "bg-[#FF5C00]"  },
  PROCESSING: { label: "Processing", textColor: "text-[#c700ff]", dotColor: "bg-[#c700ff]",  lineColor: "bg-[#c700ff]"  },
  COMPLETED:  { label: "Completed",  textColor: "text-[#10b981]", dotColor: "bg-[#10b981]",  lineColor: "bg-[#10b981]"  },
};

const PAYMENT_STATUS_COLOR: Record<string, string> = {
  PAID:      "text-[#10b981]",
  PENDING:   "text-[#FF5C00]",
  ESCROW:    "text-blue-500",
  RELEASED:  "text-[#10b981]",
  REFUNDED:  "text-gray-500",
};

// â”€â”€â”€ Copy-to-clipboard icon â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CopyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      className="w-4 h-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
      />
    </svg>
  );
}

// â”€â”€â”€ CopyButton â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };
  return (
    <button
      onClick={handleCopy}
      title="Copy"
      className={`p-1 rounded transition-colors ${
        copied ? "text-green-500" : "text-gray-400 hover:text-gray-700"
      }`}
    >
      {copied ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <CopyIcon />
      )}
    </button>
  );
}

// â”€â”€â”€ Contact Owner Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface ContactOwnerModalProps {
  items: any[];
  onClose: () => void;
}

function ContactOwnerModal({ items, onClose }: ContactOwnerModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Deduplicate owners: one card per unique owner id
  const ownerMap = new Map<number, { owner: any; equipmentTitles: string[] }>();
  for (const item of items) {
    const owner = item.equipment?.owner;
    if (!owner) continue;
    if (!ownerMap.has(owner.id)) {
      ownerMap.set(owner.id, { owner, equipmentTitles: [item.equipment.title] });
    } else {
      ownerMap.get(owner.id)!.equipmentTitles.push(item.equipment.title);
    }
  }
  const ownerEntries = Array.from(ownerMap.values());

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
    >
      <div className="bg-white w-full max-w-lg rounded-t-2xl px-5 pt-5 pb-10 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-gray-900">Owner details</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 font-bold text-sm"
          >
            X
          </button>
        </div>

        {ownerEntries.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">
            No owner information available.
          </p>
        ) : (
          <div className="space-y-4 mb-6">
            {ownerEntries.map(({ owner, equipmentTitles }) => (
              <div
                key={owner.id}
                className="border border-gray-200 rounded-xl p-4"
              >
                {/* Equipment name(s) */}
                <h3 className="font-bold text-gray-900 text-base mb-3">
                  {equipmentTitles.join(", ")}
                </h3>

                {/* Owner details grid */}
                <div className="space-y-2 text-sm">
                  {/* Name */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 w-20 shrink-0">Name</span>
                    <span className="font-medium text-gray-900">
                      {owner.firstName} {owner.lastName}
                    </span>
                  </div>

                  {/* Phone */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 w-20 shrink-0">Phone</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {owner.phone || "â€”"}
                      </span>
                      {owner.phone && <CopyButton value={owner.phone} />}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 w-20 shrink-0">Email</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate max-w-[160px]">
                        {owner.email || "â€”"}
                      </span>
                      {owner.email && <CopyButton value={owner.email} />}
                    </div>
                  </div>

                  {/* Preferred communication */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 w-20 shrink-0">Preferred</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#0B215E] uppercase text-xs tracking-wider">
                        {owner.preferredCommunication || "EMAIL"}
                      </span>
                      {owner.preferredCommunication?.toLowerCase() === "whatsapp" &&
                        owner.phone && (
                          <CopyButton value={owner.phone} />
                        )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Review customer button */}
        <button className="w-full bg-[#FF5C00] text-white rounded-full py-4 text-sm font-bold hover:bg-orange-600 transition-colors">
          Review customer
        </button>
      </div>
    </div>
  );
}

// â”€â”€â”€ Order Details Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [order, setOrder] = useState<any>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [reviewToast, setReviewToast] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [invoiceDownloading, setInvoiceDownloading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    setFetchError(null);
    fetch(`${API_BASE}/api/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json();
      })
      .then((data) => setOrder(data))
      .catch((err) => {
        console.error(err);
        setFetchError(err.message || 'Failed to connect to the server. Make sure the backend is running on port 5000.');
      });
  }, [id, router]);

  if (fetchError)
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-500 text-sm mb-6">{fetchError}</p>
          <button onClick={() => window.location.reload()} className="bg-[#FF5C00] text-white rounded-xl py-3 px-6 text-sm font-bold hover:bg-orange-600 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );

  if (!order)
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0B215E] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading order...</p>
        </div>
      </div>
    );

  // Determine current step index (CREATED is always step 0)
  const effectiveStatus = order.status === "CANCELED" ? "PENDING" : order.status;
  const currentStepIndex = STATUS_STEPS.indexOf(
    effectiveStatus as (typeof STATUS_STEPS)[number]
  );

  const paymentStatus = order.payment?.status || "PENDING";
  const paymentColor =
    PAYMENT_STATUS_COLOR[paymentStatus] || "text-gray-500";

  const topStatusMeta = STATUS_META[order.status] || STATUS_META.PENDING;

  const itemsTotal = order.items?.reduce((s: number, it: any) => s + Number(it.totalAmount), 0) || 0;
  const displaySubtotal = order.subtotal || itemsTotal || order.totalAmount;
  const displayTax = order.tax || (order.subtotal ? 0 : itemsTotal * 0.18);
  const displayTotal = order.tax ? order.totalAmount : (itemsTotal + itemsTotal * 0.18);

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-24">
      <Header />

      <div className="px-4 pt-4">
        {/* â”€â”€ Title + status badge â”€â”€ */}
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-2xl font-bold text-gray-900">Order details</h1>
          <span className={`font-bold capitalize text-sm ${topStatusMeta.textColor}`}>
            {topStatusMeta.label}
          </span>
        </div>

        {/* â”€â”€ Order ID â”€â”€ */}
        <div className="mb-2 text-sm">
          <span className="font-bold text-gray-900">Order Id: </span>
          <span className="font-bold text-gray-700">{order.orderNumber}</span>
        </div>

        {/* â”€â”€ Total + Payment status â”€â”€ */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-sm">
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
              <span className={`font-bold ${paymentColor}`}>{paymentStatus}</span>
            </div>
          </div>
        </div>

        {/* â”€â”€ Order Tracking Timeline â”€â”€ */}
        <h3 className="font-bold text-gray-900 text-sm mb-3">Order tracking</h3>
        <div className="relative mb-10 px-2">
          {/* Background line */}
          <div className="absolute top-[7px] left-2 right-2 h-[2px] bg-gray-200" />
          {/* Active line overlay */}
          {currentStepIndex > 0 && (
            <div
              className={`absolute top-[7px] left-2 h-[2px] transition-all ${
                STATUS_META[order.status === "CANCELED" ? "PENDING" : order.status]
                  ?.lineColor || "bg-gray-400"
              }`}
              style={{
                width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%`,
              }}
            />
          )}

          <div className="flex justify-between relative z-10">
            {STATUS_STEPS.map((step, index) => {
              const meta = STATUS_META[step];
              const isActive = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              return (
                <div key={step} className="flex flex-col items-center">
                  <div
                    className={`w-3.5 h-3.5 rounded-full border-2 mb-1 transition-all ${
                      isActive
                        ? `${meta.dotColor} border-transparent`
                        : "bg-white border-gray-300"
                    } ${isCurrent ? "ring-2 ring-offset-1 ring-current" : ""}`}
                  />
                  <span
                    className={`text-[10px] font-bold ${
                      isActive ? meta.textColor : "text-gray-400"
                    }`}
                  >
                    {meta.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* â”€â”€ Items list â”€â”€ */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Items ({order.items?.length || 0})
        </h2>
        <div className="space-y-4 mb-8">
          {order.items?.map((item: any) => (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded-xl p-4 text-sm shadow-sm"
            >
              <div className="grid grid-cols-[120px_1fr] gap-y-2">
                <span className="font-bold text-gray-900">Product name</span>
                <span className="text-gray-600 text-right">
                  {item.equipment?.title}
                </span>

                <span className="font-bold text-gray-900">Category</span>
                <span className="text-gray-600 text-right">
                  {item.equipment?.category}
                </span>

                <span className="font-bold text-gray-900">Price:</span>
                <span className="text-gray-600 text-right">
                  {`Rwf ${Number(item.price).toLocaleString()}`} {"/hr"}
                </span>

                <span className="font-bold text-gray-900">Qty</span>
                <span className="text-gray-600 text-right">
                  {item.quantity || 1}
                </span>

                <span className="font-bold text-gray-900">Timeline</span>
                <span className="text-gray-600 text-right">
                  {item.timeline || "—"}
                </span>

                <span className="font-bold text-gray-900">Total amount</span>
                <span className="text-gray-600 text-right">
                  {`Rwf ${Number(item.totalAmount).toLocaleString()}`}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* â”€â”€ Action Buttons â”€â”€ */}
        {order.securityType && (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Security Proof</h2>
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm mb-6 shadow-sm">
              <div className="grid grid-cols-[120px_1fr] gap-y-2">
                <span className="font-bold text-gray-900">Type</span>
                <span className="text-gray-600 text-right">{order.securityType === "ID" ? "National ID" : "Caution Money"}</span>
                <span className="font-bold text-gray-900">Value</span>
                <span className="text-gray-600 text-right">{order.securityType === "money" ? `Rwf ${Number(order.securityValue).toLocaleString()}` : order.securityValue}</span>
              </div>
            </div>
          </>
        )}

        <div className="space-y-3 pb-2">
          {(!order.payment || order.payment?.status === 'PENDING') && (
            <button
              onClick={async () => {
                setPaymentLoading(true);
                try {
                  const token = localStorage.getItem('token');
                  if (!token) { router.push('/login'); return; }
                  const payRes = await fetch(`${API_BASE}/api/payments/initiate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ orderId: order.id }),
                  });
                  const data = await payRes.json();
                  if (!payRes.ok) {
                    console.error('Payment error', payRes.status, data);
                    alert(data.error || 'Payment failed. Please try again.');
                    return;
                  }
                  // Re-fetch order to reflect PAID status
                  const updated = await fetch(`${API_BASE}/api/orders/${order.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  setOrder(await updated.json());
                  setShowPaymentSuccess(true);
                } catch (error) {
                  console.error(error);
                  alert('Unable to process payment.');
                } finally {
                  setPaymentLoading(false);
                }
              }}
              disabled={paymentLoading}
              className="w-full bg-[#FF5C00] text-white rounded-xl py-4 text-sm font-bold hover:bg-orange-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {paymentLoading ? 'Processing...' : 'Pay Now'}
            </button>
          )}
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
          <button
            onClick={() => setShowContactModal(true)}
            className="w-full bg-[#0B215E] text-white rounded-xl py-4 text-sm font-bold hover:bg-blue-900 transition-colors"
          >
            Contact equipment owners
          </button>
          <button
            onClick={() => {
              // Collect unique owners from order items
              const firstOwner = order.items?.[0]?.equipment?.owner;
              const ownerName = firstOwner
                ? `${firstOwner.firstName} ${firstOwner.lastName}`.trim()
                : "Owner";
              const params = new URLSearchParams({
                orderId: String(order.id),
                orderNumber: order.orderNumber,
                ownerName,
              });
              router.push(`/messages?${params.toString()}`);
            }}
            className="w-full bg-[#c700ff] text-white rounded-xl py-4 text-sm font-bold hover:bg-purple-700 transition-colors"
          >
            Open Messenger
          </button>
          <button
            onClick={() => {
              setReviewToast(true);
              setTimeout(() => setReviewToast(false), 2500);
            }}
            className="w-full bg-[#FF5C00] text-white rounded-xl py-4 text-sm font-bold hover:bg-orange-600 transition-colors"
          >
            Review the owner
          </button>
        </div>
      </div>

      <BottomNav />

      {/* â”€â”€ Contact Owner Modal â”€â”€ */}
      {showContactModal && (
        <ContactOwnerModal
          items={order.items || []}
          onClose={() => setShowContactModal(false)}
        />
      )}

      {/* â”€â”€ Payment Success Modal â”€â”€ */}
      {showPaymentSuccess && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4"
          onClick={() => setShowPaymentSuccess(false)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-2xl p-6 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Successful</h2>
            <p className="text-sm text-gray-500 mb-6">
              Rwf {Number(order.totalAmount).toLocaleString()} paid for order #{order.orderNumber}
            </p>
            <button
              onClick={async () => {
                setInvoiceDownloading(true);
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
                } finally {
                  setInvoiceDownloading(false);
                }
              }}
              disabled={invoiceDownloading}
              className="w-full bg-[#0B215E] text-white rounded-xl py-3.5 text-sm font-bold hover:bg-blue-900 transition-colors disabled:opacity-60 mb-3"
            >
              {invoiceDownloading ? 'Downloading...' : 'Download Invoice'}
            </button>
            <button
              onClick={() => setShowPaymentSuccess(false)}
              className="w-full bg-gray-100 text-gray-700 rounded-xl py-3.5 text-sm font-bold hover:bg-gray-200 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* â”€â”€ Review toast â”€â”€ */}
      {reviewToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-5 py-3 rounded-full shadow-lg z-50 animate-fade-in">
          Review feature coming soon!
        </div>
      )}
    </div>
  );
}




