"use client";
import { API_BASE } from "@/lib/config";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

export default function BookEquipmentPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const [equipment, setEquipment] = useState<any>(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rentalType, setRentalType] = useState<"hourly" | "daily">("daily");
  const [quantity, setQuantity] = useState(1);

  const { addToCart } = useCart();

  useEffect(() => {
    if (id) {
      fetch(`${API_BASE}/api/equipments/${id}`)
        .then((res) => res.json())
        .then((data) => setEquipment(data))
        .catch((err) => console.error(err));
    }
  }, [id]);

  const pad = (value: number) => String(value).padStart(2, "0");
  const getToday = () => {
    const now = new Date();
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  };
  const getNowDateTimeLocal = () => {
    const now = new Date();
    now.setSeconds(0, 0);
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  const calcTotal = () => {
    if (!startDate || !endDate || !equipment) return 0;
    const ms = new Date(endDate).getTime() - new Date(startDate).getTime();
    if (ms <= 0) return 0;
    if (rentalType === "hourly") {
      const hours = ms / (1000 * 60 * 60);
      return +(hours * (equipment.hourlyRate || 0) * quantity).toFixed(2);
    }
    const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
    return +(days * (equipment.dailyRate || equipment.hourlyRate * 8 || 0) * quantity).toFixed(2);
  };

  const getTimeline = () => {
    if (!startDate || !endDate) return "";
    const ms = new Date(endDate).getTime() - new Date(startDate).getTime();
    if (ms <= 0) return "";
    if (rentalType === "hourly") {
      const hours = Math.ceil(ms / (1000 * 60 * 60));
      return `${hours} hour${hours > 1 ? "s" : ""}`;
    }
    const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
    return `${days} day${days > 1 ? "s" : ""}`;
  };

  const handleAddToCart = () => {
    if (!startDate || !endDate) { alert("Please select start and end dates."); return; }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) { alert("End date must be after start date."); return; }

    const total = calcTotal();
    if (total <= 0) { alert("Invalid dates selected."); return; }

    addToCart({
      equipmentId: Number(id),
      title: equipment.title,
      category: equipment.category,
      hourlyRate: equipment.hourlyRate,
      dailyRate: equipment.dailyRate,
      location: equipment.location,
      startDate,
      endDate,
      timeline: getTimeline(),
      price: rentalType === "hourly" ? equipment.hourlyRate : equipment.dailyRate || equipment.hourlyRate * 8,
      quantity,
      totalAmount: total,
    });

    router.push("/cart");
  };

  if (!equipment) return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#0B215E] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const rate = rentalType === "hourly" ? equipment.hourlyRate : equipment.dailyRate || equipment.hourlyRate * 8;
  const startMin = rentalType === "hourly" ? getNowDateTimeLocal() : getToday();

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-900 mb-4 flex items-center gap-1 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          Back
        </button>

        <h1 className="text-xl font-bold text-gray-900 mb-1">{equipment.title}</h1>
        <p className="text-sm text-gray-500 mb-6">{equipment.category}</p>

        {/* Rental Type Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
          <button onClick={() => setRentalType("daily")} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${rentalType === "daily" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>Per Day</button>
          <button onClick={() => setRentalType("hourly")} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${rentalType === "hourly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>Per Hour</button>
        </div>

        {/* Quantity */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
          <div className="flex items-center gap-3">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold text-lg">-</button>
            <span className="font-bold text-gray-900 text-lg w-8 text-center">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold text-lg">+</button>
          </div>
        </div>

        {/* Date/Time Inputs */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start {rentalType === "hourly" ? "Date & Time" : "Date"}</label>
            <input type={rentalType === "hourly" ? "datetime-local" : "date"} value={startDate} min={startMin} onChange={(e) => setStartDate(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End {rentalType === "hourly" ? "Date & Time" : "Date"}</label>
            <input type={rentalType === "hourly" ? "datetime-local" : "date"} value={endDate} min={startDate || startMin} onChange={(e) => setEndDate(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>

        {/* Summary */}
        {startDate && endDate && calcTotal() > 0 && (
          <div className="bg-blue-50 rounded-lg p-3 mb-4 text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Quantity:</span>
              <span className="font-semibold text-gray-900">{quantity}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Duration:</span>
              <span className="font-semibold text-gray-900">{getTimeline()}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Rate:</span>
              <span className="font-semibold text-gray-900">Rwf {rate}/{rentalType === "hourly" ? "hr" : "day"}</span>
            </div>
            <div className="flex justify-between border-t border-blue-100 pt-2 mt-2">
              <span className="text-gray-800 font-bold">Total:</span>
              <span className="font-bold text-[#FF5C00]">Rwf {calcTotal()}</span>
            </div>
          </div>
        )}

        <button onClick={handleAddToCart} className="w-full bg-[#0B215E] text-white py-3 rounded-md font-semibold text-sm hover:bg-blue-900 transition-colors">
          Add to Cart
        </button>
      </div>
    </div>
  );
}




