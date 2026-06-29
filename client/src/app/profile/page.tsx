"use client";
import { API_BASE } from "@/lib/config";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import OwnerBottomNav from "@/components/OwnerBottomNav";

// â”€â”€â”€ Edit Profile Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface EditProfileModalProps {
  user: any;
  onClose: () => void;
  onSave: (data: any) => void;
}
function EditProfileModal({ user, onClose, onSave }: EditProfileModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    phone: user.phone || "",
    email: user.email || "",
    preferredCommunication: user.preferredCommunication || "EMAIL",
    identityDocumentUrl: user.identityDocumentUrl || "",
  });
  const [saving, setSaving] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, identityDocumentUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
    >
      <div className="bg-white w-full max-w-lg rounded-t-2xl px-6 pt-6 pb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Edit profile</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center border border-gray-300 rounded-md text-gray-600 font-bold text-sm hover:bg-gray-50"
          >
            X
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name</label>
            <input
              type="text"
              value={`${form.firstName} ${form.lastName}`}
              onChange={(e) => {
                const [fn, ...rest] = e.target.value.split(" ");
                setForm((p) => ({ ...p, firstName: fn, lastName: rest.join(" ") }));
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B215E]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B215E]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Identity document</label>
            <div className="relative flex border border-gray-300 rounded-lg px-4 py-3 items-center justify-between bg-white hover:bg-gray-50 overflow-hidden">
              <span className="text-sm text-gray-700 truncate">
                {form.identityDocumentUrl ? "Document uploaded" : "Upload ID document"}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              readOnly
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Preferred communication</label>
            <div className="relative">
              <select
                value={form.preferredCommunication}
                onChange={(e) => setForm((p) => ({ ...p, preferredCommunication: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-[#0B215E] font-semibold"
              >
                <option value="EMAIL">EMAIL</option>
                <option value="PHONE">PHONE</option>
                <option value="WHATSAPP">WHATSAPP</option>
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </span>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#0B215E] text-white py-4 rounded-lg font-bold text-sm mt-2 hover:bg-blue-900 transition-colors disabled:opacity-60"
          >
            {saving ? "Savingâ€¦" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

// â”€â”€â”€ Change Password Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (form.newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to change password.");
      } else {
        setSuccess(true);
        setTimeout(onClose, 1500);
      }
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
    >
      <div className="bg-white w-full max-w-lg rounded-t-2xl px-6 pt-6 pb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Change password</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center border border-gray-300 rounded-md text-gray-600 font-bold text-sm hover:bg-gray-50"
          >
            X
          </button>
        </div>
        {success ? (
          <div className="text-center py-8 text-green-600 font-semibold">Password changed successfully! âœ“</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            {["currentPassword", "newPassword", "confirmPassword"].map((field) => (
              <div key={field}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 capitalize">
                  {field === "currentPassword" ? "Current password" : field === "newPassword" ? "New password" : "Confirm password"}
                </label>
                <input
                  type="password"
                  value={(form as any)[field]}
                  onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B215E]"
                  required
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#0B215E] text-white py-4 rounded-lg font-bold text-sm mt-2 hover:bg-blue-900 transition-colors disabled:opacity-60"
            >
              {saving ? "Changingâ€¦" : "Change"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// â”€â”€â”€ Profile Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState("");
  const [trustScore, setTrustScore] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const fetchMe = async () => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUser(await res.json());
      } else {
        router.push("/login");
      }
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMe(); }, []);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && user?.id) {
      fetch(`${API_BASE}/api/community/trust-score/${user.id}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(setTrustScore).catch(() => {});
    }
  }, [user?.id]);

  const handleSaveProfile = async (data: any) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setUser((prev: any) => ({ ...prev, ...updated }));
      showToast("Profile updated successfully!");
    } else {
      showToast("Failed to update profile.");
    }
  };

  const send2FACode = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/api/auth/2fa/send-code`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      showToast("Verification code sent to your email.");
    } else {
      showToast("Could not send verification code.");
    }
  };

  const toggle2FA = async (enable: boolean) => {
    const token = localStorage.getItem("token");
    const code = prompt("Enter the 2FA code sent to your email:");
    if (!code) return;
    const res = await fetch(`${API_BASE}/api/auth/2fa/${enable ? "enable" : "disable"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUser((prev: any) => ({ ...prev, email2faEnabled: enable }));
      showToast(`Email 2FA ${enable ? "enabled" : "disabled"} successfully.`);
    } else {
      const data = await res.json();
      showToast(data.error || "Could not update 2FA status.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handlePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      await handleSaveProfile({ profilePictureUrl: base64 });
      showToast("Profile picture updated!");
    };
    reader.readAsDataURL(file);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#0B215E] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!user) return null;

  const initials = `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`.toUpperCase();
  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-24">
      <Header />

      <div className="px-4 pt-4 space-y-4">
        {/* â”€â”€ Title row â”€â”€ */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <div className="flex gap-2">
            <button
              onClick={handleLogout}
              className="px-4 py-1.5 border border-red-500 text-red-500 text-xs font-bold rounded-md hover:bg-red-50 transition-colors"
            >
              Log out
            </button>
            <button
              onClick={() => setShowEdit(true)}
              className="px-4 py-1.5 border border-[#0B215E] text-[#0B215E] text-xs font-bold rounded-md hover:bg-blue-50 transition-colors"
            >
              Edit
            </button>
          </div>
        </div>

        {/* â”€â”€ Main info card â”€â”€ */}
        <div className="bg-white rounded-xl p-4 flex gap-4 shadow-sm">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-full bg-[#0B215E] flex items-center justify-center text-white text-xl font-bold overflow-hidden">
              {user.profilePictureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.profilePictureUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
          </div>
          {/* Details */}
          <div className="text-sm space-y-0.5 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-bold text-gray-900">{user.firstName} {user.lastName}</p>
              {user.isVerified && (
                <span className="flex items-center text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-green-200">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-3.5 h-3.5 mr-0.5 shrink-0">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                  </svg>
                  ID Verified
                </span>
              )}
              {user.phoneVerified && (
                <span className="flex items-center text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-blue-200">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-3.5 h-3.5 mr-0.5 shrink-0">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                  </svg>
                  Phone Verified
                </span>
              )}
            </div>
            <p className="text-gray-500">{user.phone || "â€”"}</p>
            <p className="text-gray-500">{user.email}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-gray-400 text-xs">Role</span>
              <span className="text-xs font-semibold text-[#0B215E] capitalize">{user.role?.toLowerCase()}</span>
            </div>
          </div>
        </div>

        {/* â”€â”€ Stats card â”€â”€ */}
        <div className="bg-white rounded-xl p-4 shadow-sm text-sm space-y-2">
          <div className="grid grid-cols-[160px_1fr] gap-y-1.5">
            <span className="text-gray-500">Joined at</span>
            <span className="text-gray-900 font-medium">
              {new Date(user.createdAt).toLocaleString("en-US", {
                month: "short", day: "numeric", year: "numeric",
                hour: "2-digit", minute: "2-digit", timeZoneName: "short",
              })}
            </span>
            <span className="text-gray-500">Total orders completed</span>
            <span className="text-gray-900 font-medium">{user._count?.orders ?? 0}</span>
            <span className="text-gray-500">Preferred communication</span>
            <span className="text-gray-900 font-medium uppercase">{user.preferredCommunication || "EMAIL"}</span>
          </div>
        </div>

        {/* â”€â”€ Additional summary â”€â”€ */}
        <div className="bg-white rounded-xl p-4 shadow-sm text-sm">
          <h3 className="font-bold text-gray-900 mb-3">Additional summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">ID VERIFICATION</span>
              <span className={`font-bold text-sm ${user.isVerified ? "text-green-500" : "text-[#FF5C00]"}`}>
                {user.isVerified ? "VERIFIED" : "UNVERIFIED"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">ID NUMBER</span>
              <span className="font-medium text-gray-700 font-mono text-xs tracking-wider">
                {user.nationalId
                  ? `${user.nationalId.slice(0, 5)}${"*".repeat(10)}${user.nationalId.slice(-3)}`
                  : "â€”"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">PASSWORD</span>
              <span className="font-mono text-gray-400 tracking-widest text-xs">â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢</span>
            </div>
          </div>
        </div>

        {/* â”€â”€ Trust Score â”€â”€ */}
        {trustScore && (
          <div className="bg-white rounded-xl p-4 shadow-sm text-sm">
            <h3 className="font-bold text-gray-900 mb-3">Trust Score</h3>
            <div className="flex items-center gap-4 mb-3">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold ${trustScore.overall >= 70 ? 'bg-[#10b981]' : trustScore.overall >= 40 ? 'bg-[#FF5C00]' : 'bg-red-500'}`}>
                {trustScore.overall}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between text-xs"><span className="text-gray-500">Reviews score</span><span className="font-semibold">{trustScore.reviewScore}/100</span></div>
                <div className="flex justify-between text-xs"><span className="text-gray-500">ID verified</span><span className={`font-semibold ${trustScore.idVerified ? 'text-green-600' : 'text-red-500'}`}>{trustScore.idVerified ? 'Yes' : 'No'}</span></div>
                <div className="flex justify-between text-xs"><span className="text-gray-500">Phone verified</span><span className={`font-semibold ${trustScore.phoneVerified ? 'text-green-600' : 'text-red-500'}`}>{trustScore.phoneVerified ? 'Yes' : 'No'}</span></div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className={`h-2 rounded-full transition-all ${trustScore.overall >= 70 ? 'bg-[#10b981]' : trustScore.overall >= 40 ? 'bg-[#FF5C00]' : 'bg-red-500'}`} style={{ width: `${trustScore.overall}%` }} />
            </div>
          </div>
        )}

        {/* â”€â”€ Security settings â”€â”€ */}
        <div className="bg-white rounded-xl p-4 shadow-sm text-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">Security settings</h3>
            <button
              onClick={send2FACode}
              className="px-3 py-1.5 text-xs font-semibold bg-[#E5F2FF] text-[#0B215E] rounded-full hover:bg-blue-100 transition-colors"
            >
              Send 2FA code
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Email 2FA Verification</span>
              <button
                onClick={() => toggle2FA(!user.email2faEnabled)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold ${user.email2faEnabled ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
              >
                {user.email2faEnabled ? 'Disable' : 'Enable'}
              </button>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">2FA status</span>
              <span className={`font-bold text-sm ${user.email2faEnabled ? 'text-green-500' : 'text-[#FF5C00]'}`}>
                {user.email2faEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Notifications</span>
              <span className="font-bold text-[#0B215E]">{user.preferredCommunication || 'EMAIL'}</span>
            </div>
          </div>
        </div>

        {/* â”€â”€ Action buttons â”€â”€ */}
        <div className="space-y-3">
          <button
            onClick={() => setShowPassword(true)}
            className="w-full bg-[#0B215E] text-white rounded-xl py-3.5 text-sm font-bold hover:bg-blue-900 transition-colors"
          >
            Change password
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full bg-[#1a7a5e] text-white rounded-xl py-3.5 text-sm font-bold hover:bg-emerald-800 transition-colors"
          >
            Change profile picture
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePictureUpload} className="hidden" />
          <button
            onClick={() => showToast("Account closure coming soon!")}
            className="w-full bg-red-500 text-white rounded-xl py-3.5 text-sm font-bold hover:bg-red-600 transition-colors"
          >
            Close your account
          </button>
        </div>

      </div>

      {user?.role === "OWNER" ? <OwnerBottomNav /> : <BottomNav />}

      {/* â”€â”€ Modals â”€â”€ */}
      {showEdit && (
        <EditProfileModal user={user} onClose={() => setShowEdit(false)} onSave={handleSaveProfile} />
      )}
      {showPassword && <ChangePasswordModal onClose={() => setShowPassword(false)} />}

      {/* â”€â”€ Toast â”€â”€ */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-5 py-3 rounded-full shadow-lg z-50 whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  );
}




