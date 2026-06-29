"use client";
import { API_BASE } from "@/lib/config";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

function PaymentReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [message, setMessage] = useState('Verifying payment...');

  useEffect(() => {
    const orderId = searchParams.get('orderId') || searchParams.get('order_id');
    if (!orderId) {
      setStatus('failed');
      setMessage('Missing payment verification parameters.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const verify = async () => {
      try {
        const query = new URLSearchParams({ orderId });
        const res = await fetch(`${API_BASE}/api/payments/verify?${query.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setStatus(data.paymentStatus === 'PAID' ? 'success' : 'pending');
          setMessage(data.paymentStatus === 'PAID' ? 'Payment successful! Redirecting to your order...' : 'Payment is pending. Redirecting to your order...');
          setTimeout(() => router.push(`/orders/${orderId}`), 1800);
        } else {
          setStatus('failed');
          setMessage(data.error || 'Payment verification failed.');
        }
      } catch (err) {
        setStatus('failed');
        setMessage('Unable to verify payment with the server.');
      }
    };

    verify();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-24">
      <Header />
      <div className="px-4 pt-4">
        <div className="max-w-xl mx-auto bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment status</h1>
          <p className="text-gray-700 mb-4">{message}</p>
          <div className="rounded-2xl p-4 bg-gray-50 border border-gray-200">
            {status === 'pending' && <p className="text-blue-600">Verifying...</p>}
            {status === 'success' && <p className="text-green-600">Payment confirmed.</p>}
            {status === 'failed' && <p className="text-red-600">Payment verification failed.</p>}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <PaymentReturnContent />
    </Suspense>
  );
}
