"use client";
import { API_BASE } from "@/lib/config";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function BookEquipmentPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const [equipment, setEquipment] = useState<any>(null);
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (id) {
      fetch(`${API_BASE}/api/equipments/${id}`)
        .then((res) => res.json())
        .then((data) => setEquipment(data))
        .catch((err) => console.error(err));
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first");
      router.push("/login");
      return;
    }

    // Basic calculation for total amount
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) || 1;
    const totalAmount = days * (equipment?.dailyRate || 0);

    try {
      const payload = {
        equipmentId: Number(id),
        startDate,
        endDate,
        totalAmount,
      };

      const res = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("Booking request sent!");
        router.push("/orders");
      }
    } catch (err) {
      alert("Error connecting to server");
    }
  };

  if (!equipment) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:max-w-7xl lg:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Request to Book: {equipment.title}</h1>
      
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${equipment.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
            {equipment.isActive ? "Available" : "Unavailable"}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-lg font-medium text-gray-900">Summary</h3>
          <p className="mt-2 text-sm text-gray-500">Rate: Rwf {Number(equipment.dailyRate || 0).toLocaleString()} / day</p>
          <p className="text-sm text-gray-500">Deposit: Rwf {Number(equipment.deposit || 0).toLocaleString()}</p>
        </div>

        <div className="pt-5">
          <div className="flex justify-end gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!equipment.isActive}
              className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${equipment.isActive ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"}`}
            >
              {equipment.isActive ? "Confirm Booking" : "Unavailable"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}




