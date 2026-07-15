"use client";
import { API_BASE } from "@/lib/config";
import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

export default function SearchPage() {
  const [equipments, setEquipments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [favIds, setFavIds] = useState<number[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/equipments`)
      .then((res) => res.json())
      .then((data) => setEquipments(data))
      .catch((err) => console.error(err));

    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${API_BASE}/api/favourites/ids`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((ids) => setFavIds(Array.isArray(ids) ? ids : []))
        .catch((err) => console.error(err));
    }
  }, []);

  const toggleFav = async (id: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      setFavIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
      await fetch(`${API_BASE}/api/favourites/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = equipments.filter((e: any) =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-20">
      <Header />
      
      <div className="px-4 pt-4">
        <h2 className="text-[#0B215E] font-bold text-lg">Welcome,</h2>
        <h1 className="text-2xl font-bold text-center mt-2 mb-6 text-black">Find and rent</h1>

        {/* Search Bar */}
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search equipment .."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-300 rounded-md py-3 px-4 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Filter Icon */}
        <div className="flex justify-end mb-6">
          <button className="text-gray-600 p-1">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 18H14V16H10V18ZM3 6V8H21V6H3ZM6 13H18V11H6V13Z" fill="currentColor"/>
             </svg>
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-4">
          {filtered.map((item: any) => {
            const isFav = favIds.includes(item.id);
            return (
              <Link key={item.id} href={`/equipment/${item.id}`} className="block">
                <div className="bg-white rounded-lg overflow-hidden relative">
                  {/* Equipment Image */}
                  <div className="h-36 w-full relative rounded-lg overflow-hidden bg-[#D9D9D9]">
                    {item.images && item.images.length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#D9D9D9]" />
                    )}
                    <span className="absolute top-2 left-2 text-[#0B215E] font-bold text-xs bg-white/70 backdrop-blur-sm rounded px-1">{item.category}</span>
                    
                    {/* Wishlist Toggle Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFav(item.id);
                      }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors shadow-sm"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill={isFav ? "currentColor" : "none"}
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                        stroke="currentColor"
                        className={`w-4 h-4 ${isFav ? "text-red-500" : "text-gray-600 hover:text-red-500"}`}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                        />
                      </svg>
                    </button>
                  </div>
                  {/* Content */}
                  <div className="pt-2">
                    <h3 className="font-bold text-sm text-gray-900 truncate">{item.title}</h3>
                    <div className="flex flex-wrap gap-2 items-center mb-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${item.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {item.isActive ? "Available" : "Unavailable"}
                      </span>
                    </div>
                    <p className="text-[#FF5C00] font-bold text-sm">Rwf {Number(item.hourlyRate || 0).toLocaleString()} / hr</p>
                    <p className="text-gray-500 text-xs">Rwf {Number(item.dailyRate || item.hourlyRate * 8 || 0).toLocaleString()} / day</p>
                    {item.maxRentalPeriod && <p className="text-[#FF5C00] text-xs font-semibold mt-0.5">Max: {item.maxRentalPeriod}</p>}
                    <p className="text-gray-500 text-xs line-clamp-2 leading-tight mt-1">
                      {item.description || "No description available"}
                    </p>

                    {/* Review quick-actions */}
                    <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-gray-100">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.location.href = `/equipment/${item.id}/reviews?write=true`;
                        }}
                        className="text-xs font-semibold text-[#0B215E] hover:text-[#c700ff] transition-colors"
                      >
                        Write Review
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.location.href = `/equipment/${item.id}/reviews`;
                        }}
                        className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        Reviews
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}




