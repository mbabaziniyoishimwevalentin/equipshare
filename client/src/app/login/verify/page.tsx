"use client";
import { API_BASE } from "@/lib/config";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginVerifyContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [userId, setUserId] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const id = params?.get("userId") || "";
    const email = params?.get("email") || "";
    setUserId(id);
    setMaskedEmail(email);
  }, [params]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !code) {
      setMessage("Please enter the verification code.");
      return;
    }

    setMessage("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-login-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        if (data.user.role === "ADMIN") {
          router.push("/admin");
        } else if (data.user.role === "OWNER") {
          router.push("/owner");
        } else {
          router.push("/search");
        }
      } else {
        setMessage(data.error || "Invalid verification code.");
      }
    } catch (err) {
      setMessage("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!userId) {
      setMessage("Unable to resend code. Please start login again.");
      return;
    }

    setMessage("");
    setResendLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/resend-login-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || "A fresh code has been sent to your email.");
      } else {
        setMessage(data.error || "Unable to resend code.");
      }
    } catch (err) {
      setMessage("Error connecting to server.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center">
      <div className="w-full max-w-md px-6 py-8">
        <div className="mb-12 border-b pb-4">
          <h1 className="text-xl font-bold text-[#0B215E]">EQUIPSHARE</h1>
        </div>

        <div className="flex flex-col flex-grow justify-center mt-4">
          <h2 className="text-3xl font-bold text-[#111827] mb-2">Verification code</h2>
          <p className="text-sm text-gray-600 mb-8">
            Enter the 6-digit code sent to <span className="font-semibold text-gray-900">{maskedEmail}</span>.
          </p>

          {message && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {message}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Verification code</label>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-3 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0B215E] text-white rounded-md py-3 text-sm font-semibold hover:bg-blue-900 transition-colors disabled:opacity-60"
            >
              {loading ? "Verifyingâ€¦" : "Verify and continue"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading || loading}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
            >
              {resendLoading ? "Sending codeâ€¦" : "Resend code"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginVerifyPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <LoginVerifyContent />
    </Suspense>
  );
}

