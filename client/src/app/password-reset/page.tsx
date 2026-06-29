"use client";
import { API_BASE } from "@/lib/config";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PasswordResetPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [message, setMessage] = useState("");

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/password-reset/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setCodeSent(true);
        setMessage("If that email exists, a reset code has been sent.");
      } else {
        setMessage(data.error || "Unable to send reset code.");
      }
    } catch (err) {
      setMessage("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  const confirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/password-reset/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Password reset successfully. You can now log in.");
        setTimeout(() => router.push("/login"), 1200);
      } else {
        setMessage(data.error || "Unable to reset password.");
      }
    } catch (err) {
      setMessage("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-gray-50 border border-gray-200 rounded-3xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-[#0B215E] mb-2">Password recovery</h1>
        <p className="text-sm text-gray-600 mb-6">
          Enter your email to request a reset code, then use the code to set a new password.
        </p>

        {message && (
          <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            {message}
          </div>
        )}

        {!codeSent ? (
          <form onSubmit={requestReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#0B215E] focus:outline-none focus:ring-1 focus:ring-[#0B215E]"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#0B215E] px-4 py-3 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-60"
            >
              {loading ? "Sendingâ€¦" : "Send reset code"}
            </button>
          </form>
        ) : (
          <form onSubmit={confirmReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#0B215E] focus:outline-none focus:ring-1 focus:ring-[#0B215E]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reset code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#0B215E] focus:outline-none focus:ring-1 focus:ring-[#0B215E]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#0B215E] focus:outline-none focus:ring-1 focus:ring-[#0B215E]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#0B215E] focus:outline-none focus:ring-1 focus:ring-[#0B215E]"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#0B215E] px-4 py-3 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-60"
            >
              {loading ? "Resettingâ€¦" : "Reset password"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-gray-500">
          <Link href="/login" className="font-semibold text-[#0B215E] hover:text-blue-700">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}



