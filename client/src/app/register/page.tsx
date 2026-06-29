"use client";
import { API_BASE } from "@/lib/config";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"RENTER" | "OWNER">("RENTER");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    dateOfBirth: "",
    preferredCommunication: "EMAIL",
    nationalId: "",
    password: "",
    profilePictureUrl: "", // for base64
    identityDocumentUrl: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const field = e.target.name;
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, [field]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, role, acceptedTerms }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        // Redirect based on role
        if (data.user.role === "OWNER") {
          router.push("/owner");
        } else {
          router.push("/search");
        }
      } else {
        const data = await res.json();
        alert(data.error || "Registration failed");
      }
    } catch (err) {
      alert("Error connecting to server");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center">
      <div className="w-full max-w-md px-6 py-8">
        {/* Header */}
        <div className="mb-8 border-b pb-4">
          <h1 className="text-xl font-bold text-[#0B215E]">EQUIPSHARE</h1>
        </div>

        <h2 className="text-2xl font-bold text-[#111827] mb-6">Create an account</h2>

        {/* Role Toggle Dropdown */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">I want to register as a</label>
          <select
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value as "RENTER" | "OWNER")}
            className="w-full border border-gray-300 rounded-md px-3 py-3 text-sm font-semibold text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="RENTER">Renter</option>
            <option value="OWNER">Owner</option>
          </select>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              name="phone"
              maxLength={10}
              placeholder="Enter your phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          {/* Password field not in screenshot, but we add it securely */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="relative pt-4 pb-2">
             <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-200" />
             </div>
             <div className="relative flex justify-center">
                <span className="bg-white px-2 text-gray-300">
                  <div className="w-6 h-1 bg-gray-300 rounded-full"></div>
                </span>
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              name="address"
              placeholder="Enter your address"
              value={formData.address}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of birth</label>
            <input
              type="date"
              name="dateOfBirth"
              placeholder="DD/MM/YYY"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prefered communication</label>
            <select
              name="preferredCommunication"
              value={formData.preferredCommunication}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-semibold text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="EMAIL">EMAIL</option>
              <option value="PHONE">PHONE</option>
              <option value="SMS">SMS</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">National ID</label>
            <input
              type="text"
              name="nationalId"
              maxLength={16}
              placeholder="Enter ID Number"
              value={formData.nationalId}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-semibold text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profile picture</label>
            <div className="relative flex border border-gray-300 rounded-md px-3 py-2 justify-between items-center bg-white hover:bg-gray-50 overflow-hidden">
               <span className="text-sm font-semibold text-gray-700 truncate mr-2">
                 {formData.profilePictureUrl ? "File selected" : "Select file"}
               </span>
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-black flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0A2.25 2.25 0 001.5 12v4.5c0 1.242 1.008 2.25 2.25 2.25h16.5A2.25 2.25 0 0022.5 16.5V12a2.25 2.25 0 00-2.25-2.224M3.75 9.776V7.5a2.25 2.25 0 012.25-2.25h12A2.25 2.25 0 0120.25 7.5v2.276M12 14.25v-4.5m0 4.5l-2.25-2.25m2.25 2.25l2.25-2.25" />
               </svg>
               <input 
                 type="file" 
                 accept="image/*" 
                 name="profilePictureUrl"
                 onChange={handleFileChange} 
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
               />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Identity document</label>
            <div className="relative flex border border-gray-300 rounded-md px-3 py-2 justify-between items-center bg-white hover:bg-gray-50 overflow-hidden">
               <span className="text-sm font-semibold text-gray-700 truncate mr-2">
                 {formData.identityDocumentUrl ? "Document selected" : "Upload ID document"}
               </span>
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-black flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0A2.25 2.25 0 001.5 12v4.5c0 1.242 1.008 2.25 2.25 2.25h16.5A2.25 2.25 0 0022.5 16.5V12a2.25 2.25 0 00-2.25-2.224M3.75 9.776V7.5a2.25 2.25 0 012.25-2.25h12A2.25 2.25 0 0120.25 7.5v2.276M12 14.25v-4.5m0 4.5l-2.25-2.25m2.25 2.25l2.25-2.25" />
               </svg>
               <input 
                 type="file" 
                 accept="image/*" 
                 name="identityDocumentUrl"
                 onChange={handleFileChange} 
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
               />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="acceptedTerms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 rounded text-[#0B215E] border-gray-300 focus:ring-[#0B215E]"
              required
            />
            <label htmlFor="acceptedTerms" className="text-sm text-gray-600">
              I accept the <span className="font-semibold text-[#0B215E]">terms of service</span> and <span className="font-semibold text-[#0B215E]">community guidelines</span>.
            </label>
          </div>

          <div className="pt-4 space-y-3">
            <button
              type="submit"
              className="w-full bg-[#0B215E] text-white rounded-md py-3 text-sm font-semibold hover:bg-blue-900 transition-colors"
            >
              Register
            </button>
            <button
              type="button"
              className="w-full bg-[#D6E8FF] text-[#0B215E] flex items-center justify-center gap-2 rounded-md py-3 text-sm font-bold hover:bg-blue-200 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Register with Google
            </button>
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-gray-400">
          Already Have An Account?{" "}
          <Link href="/login" className="text-blue-500 hover:text-blue-600 font-semibold">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}



