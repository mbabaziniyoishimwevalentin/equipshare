"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";

import { API } from "@/lib/config";

export default function Header() {
  const { cartCount } = useCart();
  const [unread, setUnread] = useState(0);

  const loadUnread = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUnread(0);
      return;
    }

    try {
      const res = await fetch(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const notifs = await res.json();
      setUnread(Array.isArray(notifs) ? notifs.filter((n) => !n.read).length : 0);
    } catch {
      setUnread(0);
    }
  };

  useEffect(() => {
    loadUnread();
    const id = setInterval(loadUnread, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex justify-between items-center px-4 py-4 bg-white sticky top-0 z-50 border-b border-gray-100">
      <h1 className="text-xl font-bold text-[#0B215E]">EQUIPSHARE</h1>

      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <Link href="/notifications" className="relative text-gray-700 hover:text-[#0B215E] transition-colors">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
            />
          </svg>
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-[#c700ff] text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>

        {/* Cart */}
        <Link href="/cart" className="relative text-gray-700 hover:text-[#0B215E] transition-colors">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-7 h-7"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
            />
          </svg>
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-[#FF5C00] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}

