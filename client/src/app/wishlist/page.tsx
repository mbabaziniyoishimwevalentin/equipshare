"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

import { API } from "@/lib/config";

interface Equipment {
  id: number;
  title: string;
  category: string;
  hourlyRate: number;
  dailyRate?: number;
  maxRentalPeriod?: string | null;
  location: string;
  images: string[];
  owner: { firstName: string; lastName: string };
}

export default function WishlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const hdrs = () => ({ Authorization: `Bearer ${localStorage.getItem("token") || ""}` });
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetch(`${API}/favourites`, { headers: hdrs() })
      .then(r => r.json())
      .then(d => { setItems(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [router]);

  const handleRemove = async (equipmentId: number) => {
    await fetch(`${API}/favourites/${equipmentId}`, { method: "POST", headers: { ...hdrs(), "Content-Type": "application/json" } });
    setItems(prev => prev.filter(i => i.id !== equipmentId));
    showToast("Removed from wishlist");
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-24">
      <Header />
      <div className="px-4 pt-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">My Wishlist</h1>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#0B215E] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-14 h-14 mx-auto mb-3 text-gray-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            <p className="text-sm font-medium">Your wishlist is empty.</p>
            <p className="text-xs mt-1">Tap the ♡ on any equipment to save it here.</p>
<Link href="/search" className="mt-4 inline-block bg-[#0B215E] text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-blue-900 transition-colors">
              Browse Equipment
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(eq => (
              <div key={eq.id} className="bg-white rounded-xl border border-gray-200 flex gap-3 p-3 shadow-sm">
                {/* Thumbnail */}
                <Link href={`/equipment/${eq.id}`} className="w-20 h-20 rounded-lg bg-gray-100 shrink-0 overflow-hidden block">
                  {eq.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={eq.images[0]} alt={eq.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-9 h-9">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                  )}
                </Link>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/equipment/${eq.id}`}>
                    <p className="font-bold text-gray-900 text-sm leading-tight hover:text-[#0B215E] transition-colors">{eq.title}</p>
                  </Link>
                  <p className="text-xs text-gray-500 mt-0.5">{eq.category}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {eq.location}
                  </div>
                  {eq.maxRentalPeriod && <p className="text-[#FF5C00] text-xs font-semibold mt-0.5">Max: {eq.maxRentalPeriod}</p>}
                  <div className="flex items-center justify-between mt-2">
                    <p className="font-bold text-[#0B215E] text-sm">Rwf {eq.hourlyRate}<span className="text-gray-400 font-normal text-xs">/hr</span></p>
                    <button onClick={() => handleRemove(eq.id)}
                      className="text-red-400 hover:text-red-600 transition-colors p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
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

