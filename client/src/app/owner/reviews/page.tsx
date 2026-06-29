"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import OwnerBottomNav from "@/components/OwnerBottomNav";

import { API } from "@/lib/config";

interface Review {
  id: number;
  rating: number;
  comment: string;
  ownerReply?: string;
  createdAt: string;
  author: { id: number; firstName: string; lastName: string; profilePictureUrl?: string };
  equipment: { id: number; title: string };
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-400 text-base">
      {"★".repeat(rating)}
      <span className="text-gray-300">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default function OwnerReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const hdrs = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token") || ""}` });
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetch(`${API}/reviews/my-equipment`, { headers: hdrs() })
      .then(r => r.json())
      .then(d => { setReviews(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [router]);

  const submitReply = async (reviewId: number) => {
    if (!replyText.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/reviews/${reviewId}/reply`, {
        method: "PATCH", headers: hdrs(), body: JSON.stringify({ ownerReply: replyText.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, ownerReply: updated.ownerReply } : r));
        setReplyingId(null);
        setReplyText("");
        showToast("Reply posted!");
      }
    } catch { showToast("Failed to save reply"); }
    finally { setSaving(false); }
  };

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-24">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-4 bg-white sticky top-0 z-50 border-b border-gray-100">
        <h1 className="text-xl font-bold text-[#0B215E]">EQUIPSHARE</h1>
        <Link href="/owner/notifications" className="text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        </Link>
      </div>

      <div className="px-4 pt-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Customer Reviews</h1>
          {avgRating && (
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{avgRating}<span className="text-sm text-gray-400">/5</span></p>
              <p className="text-xs text-gray-400">{reviews.length} total review{reviews.length !== 1 ? "s" : ""}</p>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-[#0B215E] border-t-transparent rounded-full animate-spin" /></div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-3">★</p>
            <p className="text-sm font-medium">No reviews yet on your equipment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map(r => {
              const initials = `${r.author.firstName.charAt(0)}${r.author.lastName.charAt(0)}`.toUpperCase();
              return (
                <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  {/* Equipment label */}
                  <Link href={`/equipment/${r.equipment.id}/reviews`}
                    className="text-xs font-bold text-[#0B215E] bg-blue-50 px-2 py-0.5 rounded-full mb-3 inline-block hover:underline">
                    {r.equipment.title}
                  </Link>

                  {/* Renter info */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0B215E] to-[#c700ff] flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm">{r.author.firstName} {r.author.lastName}</p>
                      <p className="text-[10px] text-gray-400">{new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                    <Stars rating={r.rating} />
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">{r.comment}</p>

                  {/* Owner reply */}
                  {r.ownerReply && (
                    <div className="bg-[#F0F4FF] rounded-lg p-3 border-l-4 border-[#0B215E] mb-2">
                      <p className="text-[10px] font-bold text-[#0B215E] mb-1">Your reply</p>
                      <p className="text-xs text-gray-700 leading-relaxed">{r.ownerReply}</p>
                    </div>
                  )}

                  {/* Reply button */}
                  {!r.ownerReply && replyingId !== r.id && (
                    <button onClick={() => { setReplyingId(r.id); setReplyText(""); }}
                      className="text-xs text-[#0B215E] font-semibold hover:underline">
                      Reply to this review
                    </button>
                  )}
                  {replyingId === r.id && (
                    <div className="mt-2">
                      <textarea rows={3} value={replyText} onChange={e => setReplyText(e.target.value)}
                        placeholder="Write your reply to this review..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#0B215E] resize-none" />
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => setReplyingId(null)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-xs font-semibold hover:bg-gray-50">Cancel</button>
                        <button onClick={() => submitReply(r.id)} disabled={saving}
                          className="flex-1 bg-[#0B215E] text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-900 disabled:opacity-60">
                          {saving ? "Posting…" : "Post reply"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
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

