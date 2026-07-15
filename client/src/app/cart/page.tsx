"use client";
import { API_BASE } from "@/lib/config";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const { cart, removeFromCart, clearCart, cartTotal } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [securityType, setSecurityType] = useState("");
  const [securityValue, setSecurityValue] = useState("");

  const TAX_RATE = 0.18;
  const subtotal = cartTotal;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const handlePlaceOrder = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    if (cart.length === 0) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subtotal,
          tax,
          totalAmount: total,
          securityType: securityType || undefined,
          securityValue: securityValue || undefined,
          items: cart.map((item) => ({
            equipmentId: item.equipmentId,
            startDate: item.startDate,
            endDate: item.endDate,
            price: item.price,
            quantity: item.quantity,
            timeline: item.timeline,
            totalAmount: item.totalAmount,
          })),
        }),
      });

      if (res.ok) {
        const order = await res.json();
        // initiate PayPack checkout
        try {
          const payRes = await fetch(`${API_BASE}/api/payments/initiate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ orderId: order.id }),
          });
          if (payRes.ok) {
            const payData = await payRes.json();
            const redirectUrl = payData.redirectUrl || payData.checkout?.redirectUrl || payData.checkout?.redirect_url || payData.checkout?.checkout_url || payData.checkout?.url || payData.checkout?.payment_link || payData.checkout?.link || payData.url || payData.payment_link || payData.link || null;
            clearCart();
            if (redirectUrl) {
              window.location.href = redirectUrl;
              return;
            }
            router.push(`/orders/${order.id}`);
            return;
          } else {
            const errorData = await payRes.json().catch(() => ({ error: 'Payment initiation failed' }));
            console.error('Payment initiation error', payRes.status, errorData);
            alert(errorData.error || 'Payment initiation failed');
            return;
          }
        } catch (err) {
          console.error('payment init failed', err);
          alert('Unable to initiate payment.');
        }
        // fallback
        clearCart();
        router.push(`/orders/${order.id}`);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to place order");
      }
    } catch (err) {
      alert("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-24">
      <Header />

      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Cart</h1>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-sm text-red-500 hover:text-red-700 font-medium"
            >
              Clear all
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
            </div>
            <p className="text-gray-500 mb-4 font-medium">Your cart is empty</p>
            <button
              onClick={() => router.push("/search")}
              className="bg-[#0B215E] text-white px-6 py-3 rounded-md text-sm font-semibold hover:bg-blue-900 transition-colors"
            >
              Browse Equipment
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {cart.map((item) => (
                <div key={item.equipmentId} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 mr-3">
                      <h3 className="font-bold text-gray-900 text-base">{item.title}</h3>
                      <span className="text-xs text-[#0B215E] font-semibold bg-blue-50 px-2 py-0.5 rounded-full">
                        {item.category}
                      </span>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.equipmentId)}
                      className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-y-1.5 text-sm">
                    <span className="text-gray-500">Location</span>
                    <span className="text-gray-800 font-medium text-right">{item.location}</span>

                    <span className="text-gray-500">Qty</span>
                    <span className="text-gray-800 font-medium text-right">{item.quantity}</span>

                    <span className="text-gray-500">Duration</span>
                    <span className="text-gray-800 font-medium text-right">{item.timeline}</span>

                    <span className="text-gray-500">From</span>
                    <span className="text-gray-800 font-medium text-right">
                      {item.startDate.includes("T")
                        ? new Date(item.startDate).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                        : new Date(item.startDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>

                    <span className="text-gray-500">To</span>
                    <span className="text-gray-800 font-medium text-right">
                      {item.endDate.includes("T")
                        ? new Date(item.endDate).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                        : new Date(item.endDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>

                    <span className="text-gray-500 font-semibold border-t border-gray-100 pt-2 mt-1">Subtotal</span>
                    <span className="text-[#FF5C00] font-bold text-right border-t border-gray-100 pt-2 mt-1">
                      {`Rwf ${Number(item.totalAmount).toLocaleString()}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-6">
              <h2 className="text-base font-bold text-gray-900 mb-3">Order Summary</h2>
              <div className="space-y-2 text-sm">
                {cart.map((item) => (
                  <div key={item.equipmentId} className="flex justify-between text-gray-600">
                    <span className="truncate mr-2">{item.title}</span>
                    <span className="font-medium text-gray-900 flex-shrink-0">{`Rwf ${Number(item.totalAmount).toLocaleString()}`}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-2 mt-2 space-y-1">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium">{`Rwf ${Number(subtotal).toLocaleString()}`}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax (18%)</span>
                    <span className="font-medium">{`Rwf ${Number(tax).toLocaleString()}`}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
                    <span className="text-gray-900">Total</span>
                    <span className="text-[#FF5C00]">{`Rwf ${Number(total).toLocaleString()}`}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Proof */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-4">
              <h2 className="text-base font-bold text-gray-900 mb-3">Security Proof</h2>
              <p className="text-xs text-gray-500 mb-3">Select how you want to provide security for this rental.</p>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer has-[:checked]:border-[#FF5C00] has-[:checked]:bg-orange-50">
                  <input type="radio" name="securityType" value="ID" checked={securityType === "ID"} onChange={() => { setSecurityType("ID"); setSecurityValue(""); }} className="accent-[#FF5C00]" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">National ID</p>
                    <p className="text-xs text-gray-500">Provide your national ID number as security</p>
                  </div>
                </label>
                {securityType === "ID" && (
                  <input type="text" placeholder="Enter your National ID number" value={securityValue} onChange={(e) => setSecurityValue(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#0B215E]" />
                )}
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer has-[:checked]:border-[#FF5C00] has-[:checked]:bg-orange-50">
                  <input type="radio" name="securityType" value="money" checked={securityType === "money"} onChange={() => { setSecurityType("money"); setSecurityValue(""); }} className="accent-[#FF5C00]" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Caution Money</p>
                    <p className="text-xs text-gray-500">Deposit a refundable caution amount</p>
                  </div>
                </label>
                {securityType === "money" && (
                  <input type="number" min="0" placeholder="Enter caution amount in Rwf" value={securityValue} onChange={(e) => setSecurityValue(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#0B215E]" />
                )}
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full bg-[#0B215E] text-white py-4 rounded-xl font-bold text-base hover:bg-blue-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Placing Order..." : `Place Order · Rwf ${Number(total).toLocaleString()}`}
            </button>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}



