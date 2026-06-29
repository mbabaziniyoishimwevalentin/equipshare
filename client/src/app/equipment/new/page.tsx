"use client";
import { API_BASE } from "@/lib/config";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

const CATEGORIES = ["Tools", "Electronics", "Kitchen", "Furniture", "Vehicles", "Garden", "Sports", "Other"];

export default function NewEquipmentPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    category: "Tools",
    description: "",
    hourlyRate: "",
    dailyRate: "",
    weeklyRate: "",
    deposit: "",
    location: "",
    specs: "",
  });
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/equipments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          hourlyRate: Number(formData.hourlyRate) || 0,
          dailyRate: Number(formData.dailyRate) || 0,
          weeklyRate: Number(formData.weeklyRate) || 0,
          deposit: Number(formData.deposit) || 0,
          images,
        }),
      });
      if (res.ok) {
        router.push("/owner");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to list equipment");
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

      <div className="px-4 pt-4 max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">List Equipment</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g. Cooking pan, Power drill..."
              className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              required
              placeholder="Describe the equipment, condition, features..."
              className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Specs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Specifications</label>
            <input
              name="specs"
              value={formData.specs}
              onChange={handleChange}
              placeholder="e.g. Brand, model, size, power..."
              className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Pricing */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pricing</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Hourly Rate (Rwf) *</label>
                <input
                  type="number"
                  name="hourlyRate"
                  value={formData.hourlyRate}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                  placeholder="14"
                  className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Daily Rate (Rwf)</label>
                <input
                  type="number"
                  name="dailyRate"
                  value={formData.dailyRate}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="80"
                  className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Weekly Rate ($)</label>
                <input
                  type="number"
                  name="weeklyRate"
                  value={formData.weeklyRate}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="400"
                  className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Security Deposit ($)</label>
                <input
                  type="number"
                  name="deposit"
                  value={formData.deposit}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="50"
                  className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location / Address *</label>
            <input
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              placeholder="e.g. Kigali, Rwanda"
              className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photos <span className="text-gray-400 text-xs">(up to 5)</span>
            </label>

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {images.map((img, i) => (
                  <div key={i} className="relative">
                    <img src={img} alt="" className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-black/80"
                    >
                      Ã—
                    </button>
                  </div>
                ))}
              </div>
            )}

            {images.length < 5 && (
              <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400 mx-auto mb-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <p className="text-sm text-gray-500">Tap to add photos</p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0B215E] text-white rounded-xl py-4 text-sm font-bold hover:bg-blue-900 transition-colors disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit Listing"}
            </button>
          </div>
        </form>
      </div>

      <BottomNav />
    </div>
  );
}



