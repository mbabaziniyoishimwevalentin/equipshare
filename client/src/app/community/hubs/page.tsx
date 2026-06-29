"use client";
import { API_BASE } from "@/lib/config";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import OwnerBottomNav from "@/components/OwnerBottomNav";

export default function HubsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [hubs, setHubs] = useState<any[]>([]);
  const [selectedHub, setSelectedHub] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    (async () => {
      const meRes = await fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (meRes.ok) setUser(await meRes.json());
    })();
    fetch(`${API_BASE}/api/community/hubs`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setHubs(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const currentHub = hubs.find(h => h.location === selectedHub);

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-24">
      <div className="bg-[#0B215E] px-4 pt-6 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => router.back()} className="text-white"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg></button>
          <h1 className="text-xl font-bold text-white">Neighborhood Hubs</h1>
        </div>
        <p className="text-blue-200 text-xs">Explore equipment available in your area</p>
      </div>
      <div className="px-4 -mt-3 space-y-4">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-[#0B215E] border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {hubs.map((h: any) => (
                <button key={h.location} onClick={() => setSelectedHub(h.location === selectedHub ? null : h.location)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${selectedHub === h.location ? 'bg-[#0B215E] text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}>
                  {h.location} ({h.count})
                </button>
              ))}
            </div>
            {currentHub ? (
              <div className="space-y-3">
                <p className="text-sm font-bold text-gray-900">{currentHub.location} â€” {currentHub.count} items</p>
                {currentHub.items.map((eq: any) => (
                  <Link key={eq.id} href={`/equipment/${eq.id}`} className="bg-white rounded-xl p-3 shadow-sm flex gap-3 hover:shadow-md transition-shadow">
                    <div className="w-16 h-16 rounded-lg bg-gray-100 shrink-0 overflow-hidden">
                      {eq.images?.[0] ? <img src={eq.images[0]} alt={eq.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No img</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{eq.title}</p>
                      <p className="text-xs text-gray-500">{eq.category}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{eq.owner?.firstName} {eq.owner?.lastName}</p>
                      <div className="flex gap-1 mt-1">
                        {eq.owner?.isVerified && <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-semibold">âœ“ Verified</span>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {hubs.map((h: any) => (
                  <button key={h.location} onClick={() => setSelectedHub(h.location)}
                    className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow text-left">
                    <div>
                      <p className="font-bold text-gray-900">{h.location}</p>
                      <p className="text-xs text-gray-500">{h.count} equipment items available</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      {user?.role === "OWNER" ? <OwnerBottomNav /> : <BottomNav />}
    </div>
  );
}



