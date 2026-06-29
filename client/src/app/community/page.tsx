"use client";
import { API_BASE } from "@/lib/config";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import OwnerBottomNav from "@/components/OwnerBottomNav";

export default function CommunityPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [communities, setCommunities] = useState<any[]>([]);
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [ccSubmitting, setCcSubmitting] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchCommunities = async () => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/api/community`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setCommunities(await res.json());
  };

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    (async () => {
      const [meRes, commRes, rsvpRes] = await Promise.all([
        fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/community`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/community/rsvps/manage`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (meRes.ok) { const u = await meRes.json(); setUser(u); }
      if (commRes.ok) setCommunities(await commRes.json());
      if (rsvpRes.ok) setRsvps(await rsvpRes.json());
      setLoading(false);
    })();
  }, []);

  const handleCreateCommunity = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCcSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`${API_BASE}/api/community`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
    if (res.ok) {
      setShowCreateCommunity(false);
      await fetchCommunities();
    } else { const d = await res.json(); alert(d.error || "Failed"); }
    setCcSubmitting(false);
  };

  const handleJoin = async (id: number) => {
    const res = await fetch(`${API_BASE}/api/community/${id}/join`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setCommunities(prev => prev.map(c => c.id === id ? { ...c, isMember: true, memberCount: c.memberCount + 1 } : c));
  };

  const handleLeave = async (id: number) => {
    const res = await fetch(`${API_BASE}/api/community/${id}/leave`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setCommunities(prev => prev.map(c => c.id === id ? { ...c, isMember: false, memberCount: c.memberCount - 1 } : c));
  };

  const handleRsvpAction = async (rsvpId: number, status: string) => {
    const reason = status === "REJECTED" ? prompt("Reason for rejection:") : "";
    const res = await fetch(`${API_BASE}/api/community/rsvps/${rsvpId}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ status, reason }) });
    if (res.ok) setRsvps(prev => prev.filter(r => r.id !== rsvpId));
  };

  const pendingRsvps = rsvps?.filter((r: any) => r.status === "PENDING") || [];

  const inputClass = "w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#0B215E]";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1";

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-24">
      <div className="bg-[#0B215E] px-4 pt-6 pb-10">
        <h1 className="text-2xl font-bold text-white">Community</h1>
        <p className="text-blue-200 text-sm mt-1">{user?.role === "OWNER" ? "Manage your community hub" : "Discover local rental communities"}</p>
      </div>
      <div className="px-4 -mt-4 space-y-4">

        {user?.role === "OWNER" && pendingRsvps.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-[#FF5C00]">
            <h2 className="font-bold text-gray-900 text-sm mb-3">Pending RSVPs ({pendingRsvps.length})</h2>
            {pendingRsvps.slice(0, 5).map((r: any) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{r.user?.firstName} {r.user?.lastName}</p>
                  <p className="text-xs text-gray-500">{r.meetup?.title || r.event?.title}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleRsvpAction(r.id, "ACCEPTED")} className="text-xs bg-[#10b981] text-white px-3 py-1.5 rounded-full font-semibold hover:bg-emerald-700">Accept</button>
                  <button onClick={() => handleRsvpAction(r.id, "REJECTED")} className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-full font-semibold hover:bg-red-600">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {user?.role === "OWNER" && (
          <>
            <button onClick={() => setShowCreateCommunity(!showCreateCommunity)}
              className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center justify-center gap-2 text-[#0B215E] font-bold text-sm hover:bg-blue-50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              {showCreateCommunity ? "Cancel" : "Create a Community"}
            </button>
            {showCreateCommunity && (
              <form onSubmit={handleCreateCommunity} className="bg-white rounded-xl p-4 shadow-sm space-y-4">
                <div><label className={labelClass}>Community Name</label><input name="name" required placeholder="e.g. Kigali Tool Sharing Group" className={inputClass} /></div>
                <div><label className={labelClass}>Description</label><textarea name="description" required rows={3} placeholder="What is this community about?" className={inputClass} /></div>
                <div><label className={labelClass}>Image (optional)</label><input type="file" name="image" accept="image/*" className={inputClass} /></div>
                <button disabled={ccSubmitting} className="w-full bg-[#0B215E] text-white rounded-xl py-3 text-sm font-bold hover:bg-blue-900 transition-colors disabled:opacity-60">{ccSubmitting ? "Creating..." : "Create Community"}</button>
              </form>
            )}
          </>
        )}

        <div>
          <h2 className="font-bold text-gray-900 text-sm mb-3">Communities</h2>
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-[#0B215E] border-t-transparent rounded-full animate-spin" /></div>
          ) : communities.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No communities yet.</div>
          ) : (
            <div className="space-y-3">
              {communities.map((c: any) => (
                <Link key={c.id} href={`/community/${c.id}`} className="block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h3 className="font-bold text-gray-900">{c.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{c.memberCount} members</p>
                    </div>
                    {c.isOwner ? (
                      <span className="text-[10px] bg-[#0B215E]/10 text-[#0B215E] font-semibold px-2 py-0.5 rounded-full">Owner</span>
                    ) : c.isMember ? (
                      <button onClick={(e) => { e.preventDefault(); handleLeave(c.id); }} className="text-xs border border-red-500 text-red-500 px-3 py-1 rounded-full font-semibold hover:bg-red-50">Leave</button>
                    ) : (
                      <button onClick={(e) => { e.preventDefault(); handleJoin(c.id); }} className="text-xs bg-[#0B215E] text-white px-3 py-1 rounded-full font-semibold hover:bg-blue-900">Join</button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{c.description}</p>
                  <p className="text-xs text-gray-400 mt-2">by {c.owner?.firstName} {c.owner?.lastName}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
      {user?.role === "OWNER" ? <OwnerBottomNav /> : <BottomNav />}
    </div>
  );
}




