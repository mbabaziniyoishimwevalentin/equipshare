"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

import { API } from "@/lib/config";

interface Review {
  id: number;
  rating: number;
  comment: string;
  ownerReply?: string;
  createdAt: string;
  author: { id: number; firstName: string; lastName: string; profilePictureUrl?: string };
}

function Stars({ rating, interactive, onRate }: { rating: number; interactive?: boolean; onRate?: (r: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <button key={i} type="button"
          disabled={!interactive}
          onClick={() => onRate?.(i)}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(0)}
          className={`text-xl transition-colors ${(hover || rating) >= i ? "text-yellow-400" : "text-gray-300"} ${interactive ? "cursor-pointer" : "cursor-default"}`}>
          ★
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review, myId, isOwner, onReply }: {
  review: Review;
  myId: number;
  isOwner: boolean;
  onReply?: (id: number, text: string) => void;
}) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState(review.ownerReply || "");
  const [saving, setSaving] = useState(false);

  const initials = `${review.author.firstName.charAt(0)}${review.author.lastName.charAt(0)}`.toUpperCase();

  const submitReply = async () => {
    if (!replyText.trim()) return;
    setSaving(true);
    await onReply?.(review.id, replyText.trim());
    setSaving(false);
    setReplying(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0B215E] to-[#c700ff] flex items-center justify-center text-white font-bold text-sm shrink-0">
          {review.author.profilePictureUrl
            ? <img src={review.author.profilePictureUrl} className="w-full h-full rounded-full object-cover" alt="" />
            : initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm">{review.author.firstName} {review.author.lastName}</p>
          <p className="text-[10px] text-gray-400">{new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
        </div>
        <Stars rating={review.rating} />
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>

      {/* Owner reply */}
      {review.ownerReply && (
        <div className="mt-3 bg-[#F0F4FF] rounded-lg p-3 border-l-4 border-[#0B215E]">
          <p className="text-[10px] font-bold text-[#0B215E] mb-1">Owner's reply</p>
          <p className="text-xs text-gray-700 leading-relaxed">{review.ownerReply}</p>
        </div>
      )}

      {/* Reply button (owner only, if no reply yet) */}
      {isOwner && !review.ownerReply && !replying && (
        <button onClick={() => setReplying(true)}
          className="mt-3 text-xs text-[#0B215E] font-semibold hover:underline">
          Reply to review
        </button>
      )}
      {isOwner && replying && (
        <div className="mt-3">
          <textarea rows={3} value={replyText} onChange={e => setReplyText(e.target.value)}
            placeholder="Write your reply..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#0B215E] resize-none" />
          <div className="flex gap-2 mt-2">
            <button onClick={() => setReplying(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-xs font-semibold hover:bg-gray-50">Cancel</button>
            <button onClick={submitReply} disabled={saving}
              className="flex-1 bg-[#0B215E] text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-900 disabled:opacity-60">
              {saving ? "Saving…" : "Post reply"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EquipmentReviewsPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myId, setMyId] = useState(0);
  const [myRole, setMyRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const [equipTitle, setEquipTitle] = useState("");

  const hdrs = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token") || ""}` });
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) { const parsed = JSON.parse(u); setMyId(parsed.id); setMyRole(parsed.role); }
    if (searchParams.get("write") === "true") setShowForm(true);
    if (!id) return;
    // Load equipment title
    fetch(`${API}/equipments/${id}`)
      .then(r => r.json()).then(e => setEquipTitle(e.title || ""));
    // Load reviews
    fetch(`${API}/reviews/equipment/${id}`)
      .then(r => r.json()).then(data => { setReviews(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) { showToast("Please select a rating"); return; }
    if (!comment.trim()) { showToast("Please write a comment"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/reviews`, {
        method: "POST",
        headers: hdrs(),
        body: JSON.stringify({ equipmentId: Number(id), rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Failed to submit"); return; }
      setReviews(prev => [data, ...prev]);
      setShowForm(false);
      setRating(0);
      setComment("");
      showToast("Review submitted!");
    } catch { showToast("Network error"); }
    finally { setSubmitting(false); }
  };

  const handleReply = async (reviewId: number, text: string) => {
    const res = await fetch(`${API}/reviews/${reviewId}/reply`, {
      method: "PATCH", headers: hdrs(), body: JSON.stringify({ ownerReply: text }),
    });
    if (res.ok) {
      const updated = await res.json();
      setReviews(prev => prev.map(r => r.id === reviewId ? updated : r));
      showToast("Reply posted!");
    }
  };

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;
  const isOwner = myRole === "OWNER";

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-24">
      <Header />
      <div className="px-4 pt-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
            {equipTitle && <p className="text-sm text-gray-500 mt-0.5">{equipTitle}</p>}
          </div>
          {avg && (
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">{avg}</p>
              <Stars rating={Math.round(Number(avg))} />
              <p className="text-xs text-gray-400 mt-0.5">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
            </div>
          )}
        </div>

        {/* Write review button (renters only, if not already reviewed) */}
        {!isOwner && !reviews.find(r => r.author.id === myId) && (
          <button onClick={() => setShowForm(v => !v)}
            className="w-full mb-4 bg-[#0B215E] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-blue-900 transition-colors">
            {showForm ? "Cancel" : "Write a Review"}
          </button>
        )}

        {/* Review form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3">Your review</h3>
            <div className="mb-3">
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Rating</label>
              <Stars rating={rating} interactive onRate={setRating} />
            </div>
            <div className="mb-3">
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Comment</label>
              <textarea rows={4} value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Share your experience with this equipment..."
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#0B215E] resize-none" />
            </div>
            <button type="submit" disabled={submitting}
              className="w-full bg-[#c700ff] text-white py-3 rounded-xl font-bold text-sm hover:bg-purple-700 transition-colors disabled:opacity-60">
              {submitting ? "Submitting…" : "Submit Review"}
            </button>
          </form>
        )}

        {/* Reviews list */}
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-[#0B215E] border-t-transparent rounded-full animate-spin" /></div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">★</p>
            <p className="text-sm font-medium">No reviews yet.</p>
            <p className="text-xs mt-1">Be the first to leave a review!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <ReviewCard key={r.id} review={r} myId={myId} isOwner={isOwner} onReply={handleReply} />
            ))}
          </div>
        )}
      </div>
      <BottomNav />
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-5 py-3 rounded-full shadow-lg z-50 whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  );
}

