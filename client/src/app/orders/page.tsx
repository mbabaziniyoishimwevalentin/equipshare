"use client";
import { API_BASE } from "@/lib/config";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

const STATUS_STYLES: Record<string, { text: string; dot: string; label: string }> = {
  PENDING:    { text: "text-[#FF5C00]",  dot: "bg-[#FF5C00]",  label: "Pending" },
  PROCESSING: { text: "text-[#c700ff]",  dot: "bg-[#c700ff]",  label: "Processed" },
  COMPLETED:  { text: "text-[#10b981]",  dot: "bg-[#10b981]",  label: "Completed" },
  CANCELED:   { text: "text-red-500",    dot: "bg-red-500",    label: "Canceled" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetch(`${API_BASE}/api/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch orders", err);
        setLoading(false);
      });
  }, [router]);

  const filtered = orders.filter((o) =>
    o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-24">
      <Header />

      <div className="px-4 pt-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">My orders</h1>

        {/* Search + filter */}
        <div className="flex items-center gap-2 mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by order number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-300 rounded-md py-3 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {/* Filter icon */}
          <button className="text-gray-600 p-2 border border-gray-300 rounded-md">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 6h16M7 12h10M10 18h4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#0B215E] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-10 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-12 h-12 text-gray-300 mx-auto mb-3"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
            <p className="text-gray-500 text-sm font-medium">
              {searchQuery ? "No orders match your search." : "You don't have any orders yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order: any) => {
              const s = STATUS_STYLES[order.status] || STATUS_STYLES.PENDING;
              return (
                <div
                  key={order.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
                >
                  {/* Header row */}
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-bold text-gray-900 text-sm">
                      Order {order.orderNumber}
                    </span>
                    <span className="text-xs text-gray-400 font-medium text-right leading-tight">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-[100px_1fr] gap-y-1.5 text-sm mb-3">
                    <span className="text-gray-500">Status</span>
                    <span className={`font-semibold flex items-center gap-1.5 ${s.text}`}>
                      <span className={`w-2 h-2 rounded-full inline-block ${s.dot}`} />
                      {s.label}
                    </span>

                    <span className="text-gray-500">Total price:</span>
                    <span className="text-gray-900 font-medium">
                      {`Rwf ${Number(order.totalAmount).toLocaleString()}`}
                    </span>

                    <span className="text-gray-500">Items:</span>
                    <span className="text-gray-900 font-medium">
                      {order.items?.length || 0}
                    </span>
                  </div>

                  {/* View details link */}
                  <div className="flex justify-end border-t border-gray-100 pt-2">
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-[#0B215E] text-xs font-semibold hover:underline"
                    >
                      View details â†’
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}



