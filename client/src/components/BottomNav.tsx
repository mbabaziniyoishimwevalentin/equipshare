"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";

export default function BottomNav() {
  const pathname = usePathname();
  const { cartCount } = useCart();

  const active = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 px-2 z-50 shadow-lg">

      {/* Home */}
      <Link
        href="/search"
        className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
          active("/search") ? "text-[#0B215E]" : "text-gray-400 hover:text-gray-600"
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill={active("/search") ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      </Link>

      {/* Cart */}
      <Link
        href="/cart"
        className={`flex flex-col items-center gap-0.5 relative px-2 py-1 rounded-lg transition-colors ${
          active("/cart") ? "text-[#0B215E]" : "text-gray-400 hover:text-gray-600"
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
        </svg>
        {cartCount > 0 && (
          <span className="absolute -top-0.5 right-0.5 bg-[#FF5C00] text-white text-[9px] font-bold rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-0.5">
            {cartCount}
          </span>
        )}
      </Link>

      {/* Orders */}
      <Link
        href="/orders"
        className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
          active("/orders") ? "text-[#0B215E]" : "text-gray-400 hover:text-gray-600"
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      </Link>

      {/* Community */}
      <Link
        href="/community"
        className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
          active("/community") ? "text-[#10b981]" : "text-gray-400 hover:text-gray-600"
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      </Link>

      {/* Wishlist */}
      <Link
        href="/wishlist"
        className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
          active("/wishlist") ? "text-red-500" : "text-gray-400 hover:text-gray-600"
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg"
          fill={active("/wishlist") ? "currentColor" : "none"}
          viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      </Link>

      {/* Profile */}
      <Link
        href="/profile"
        className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
          active("/profile") ? "text-[#0B215E]" : "text-gray-400 hover:text-gray-600"
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </Link>
    </div>
  );
}
