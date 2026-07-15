"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useCart } from "@/context/CartContext";

import { API } from "@/lib/config";

export default function EquipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const [equipment, setEquipment] = useState<any>(null);
  const [similarItems, setSimilarItems] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [bookedPeriods, setBookedPeriods] = useState<Array<{ startDate: string; endDate: string }>>([]);
  const { addToCart, cart } = useCart();

  // Favourite
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  // Reviews summary
  const [reviewAvg, setReviewAvg] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);

  // Booking modal state
  const [showModal, setShowModal] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rentalType, setRentalType] = useState<"hourly" | "daily">("daily");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const alreadyInCart = cart.some((c) => c.equipmentId === Number(id));

  useEffect(() => {
    if (!id) return;
    fetch(`${API}/equipments/${id}`)
      .then((res) => res.json())
      .then((data) => {
          setBookedPeriods(data.orderItems || []);
        setEquipment(data);
        setSelectedImage(data.images?.[0] || null);
        if (data.category) {
          fetch(`${API}/equipments?category=${encodeURIComponent(data.category)}`)
            .then((r) => r.json())
            .then((all) => setSimilarItems(all.filter((e: any) => e.id !== data.id).slice(0, 4)))
            .catch(console.error);
        }
      })
      .catch((err) => console.error(err));

    // Load reviews summary
    fetch(`${API}/reviews/equipment/${id}`)
      .then(r => r.json())
      .then((reviews: any[]) => {
        if (Array.isArray(reviews) && reviews.length) {
          setReviewCount(reviews.length);
          setReviewAvg(+(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1));
        }
      }).catch(() => {});

    // Check if already favourited
    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${API}/favourites/ids`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then((ids: number[]) => { if (Array.isArray(ids)) setIsFav(ids.includes(Number(id))); })
        .catch(() => {});
    }
  }, [id]);

  const toggleFav = async () => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    setFavLoading(true);
    try {
      const res = await fetch(`${API}/favourites/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (res.ok) { const d = await res.json(); setIsFav(d.favourited); }
    } catch { /* */ } finally { setFavLoading(false); }
  };

  const calcTotal = () => {
    if (!startDate || !endDate || !equipment) return 0;
    const ms = new Date(endDate).getTime() - new Date(startDate).getTime();
    if (ms <= 0) return 0;
    if (rentalType === "hourly") {
      const hours = ms / (1000 * 60 * 60);
      return +(hours * (equipment.hourlyRate || 0) * quantity).toFixed(2);
    } else {
      const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
      return +(
        days * (equipment.dailyRate || equipment.hourlyRate * 8 || 0) * quantity
      ).toFixed(2);
    }
  };

  const getTimeline = () => {
    if (!startDate || !endDate) return "";
    const ms = new Date(endDate).getTime() - new Date(startDate).getTime();
    if (ms <= 0) return "";
    if (rentalType === "hourly") {
      const hours = Math.ceil(ms / (1000 * 60 * 60));
      return `${hours} hour${hours > 1 ? "s" : ""}`;
    } else {
      const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
      return `${days} day${days > 1 ? "s" : ""}`;
    }
  };

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
  const selectedPeriodOverlaps = () => {
    if (!startDate || !endDate) return false;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return bookedPeriods.some((period) => {
      const bookedStart = new Date(period.startDate);
      const bookedEnd = new Date(period.endDate);
      return start < bookedEnd && end > bookedStart;
    });
  };
  const startMin = rentalType === "hourly" ? getNowDateTimeLocal() : getToday();
  const endMin = startDate ? startDate : getToday();

  const bookingValidationMessage = () => {
    if (!startDate || !endDate) return "";
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (rentalType === "hourly" && start < new Date(getNowDateTimeLocal())) {
      return "Start date and time cannot be in the past.";
    }
    if (rentalType === "daily" && start < new Date(getToday())) {
      return "Start date cannot be in the past.";
    }
    if (end <= start) {
      return "End date must be after start date.";
    }
    if (selectedPeriodOverlaps()) {
      return "The selected period overlaps an already booked date range.";
    }
    if (equipment.maxRentalPeriod) {
      const ms = end.getTime() - start.getTime();
      const unit = equipment.maxRentalPeriod.includes("day") ? "day" : equipment.maxRentalPeriod.includes("week") ? "week" : equipment.maxRentalPeriod.includes("month") ? "month" : null;
      const maxVal = parseInt(equipment.maxRentalPeriod);
      if (unit === "day" && rentalType === "daily") {
        const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
        if (days > maxVal) return `Rental cannot exceed ${equipment.maxRentalPeriod}.`;
      }
      if (unit === "week" && rentalType === "daily") {
        const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
        if (days > maxVal * 7) return `Rental cannot exceed ${equipment.maxRentalPeriod}.`;
      }
      if (unit === "month" && rentalType === "daily") {
        const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
        if (days > maxVal * 30) return `Rental cannot exceed ${equipment.maxRentalPeriod}.`;
      }
    }
    return "";
  };
  const bookingError = bookingValidationMessage();

  const handleConfirmAddToCart = () => {
    if (!startDate || !endDate) {
      alert("Please select start and end dates.");
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (rentalType === "hourly") {
      const minDateTime = new Date(getNowDateTimeLocal());
      if (start < minDateTime) {
        alert("Start date and time cannot be in the past.");
        return;
      }
    } else if (start < new Date(getToday())) {
      alert("Start date cannot be in the past.");
      return;
    }
    if (end <= start) {
      alert("End date must be after start date.");
      return;
    }
    if (selectedPeriodOverlaps()) {
      alert("The selected period overlaps an already booked date range.");
      return;
    }
    if (equipment.maxRentalPeriod) {
      const ms = end.getTime() - start.getTime();
      const unit = equipment.maxRentalPeriod.includes("day") ? "day" : equipment.maxRentalPeriod.includes("week") ? "week" : equipment.maxRentalPeriod.includes("month") ? "month" : null;
      const maxVal = parseInt(equipment.maxRentalPeriod);
      if (unit === "day" && rentalType === "daily") {
        const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
        if (days > maxVal) { alert(`Rental cannot exceed ${equipment.maxRentalPeriod}.`); return; }
      }
      if (unit === "week" && rentalType === "daily") {
        const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
        if (days > maxVal * 7) { alert(`Rental cannot exceed ${equipment.maxRentalPeriod}.`); return; }
      }
      if (unit === "month" && rentalType === "daily") {
        const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
        if (days > maxVal * 30) { alert(`Rental cannot exceed ${equipment.maxRentalPeriod}.`); return; }
      }
    }
    const total = calcTotal();
    if (total <= 0) {
      alert("End date must be after start date.");
      return;
    }
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
      price:
        rentalType === "hourly"
          ? equipment.hourlyRate
          : equipment.dailyRate || equipment.hourlyRate * 8,
      quantity,
      totalAmount: total,
    });
    setShowModal(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  };

  if (!equipment)
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0B215E] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading equipment...</p>
        </div>
      </div>
    );

  const rate =
    rentalType === "hourly"
      ? equipment.hourlyRate
      : equipment.dailyRate || equipment.hourlyRate * 8;

  const allImages: string[] = equipment.images || [];

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-24">
      <Header />

      <div className="px-4 pt-4">
        {/* ── Title + heart + Cart button ── */}
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight pr-2">
            {equipment.title}
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            {/* Favourite / Wishlist button */}
            <button
              onClick={toggleFav}
              disabled={favLoading}
              aria-label={isFav ? "Remove from wishlist" : "Add to wishlist"}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={isFav ? "#ef4444" : "none"}
                stroke={isFav ? "#ef4444" : "#9ca3af"}
                strokeWidth={1.8}
                className="w-5 h-5 transition-all">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </button>
            <button
              onClick={() => !equipment.isActive ? undefined : alreadyInCart ? router.push("/cart") : (setQuantity(1), setShowModal(true))}
              disabled={!equipment.isActive}
              className={`text-white text-xs font-semibold px-4 py-2 rounded-md transition-all ${
                !equipment.isActive
                  ? "bg-gray-400 cursor-not-allowed"
                  : alreadyInCart
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-[#0B215E] hover:bg-blue-900"
              }`}
            >
              {!equipment.isActive ? "Unavailable" : alreadyInCart ? "✓ In Cart" : added ? "Added!" : "Add to cart"}
            </button>
          </div>
        </div>

        {/* ── Ratings + Price ── */}
        <div className="flex flex-col gap-2 text-sm mb-1">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Ratings: </span>
              {reviewAvg ? (
                <span className="text-[#FF5C00] font-bold">{reviewAvg}/5</span>
              ) : (
                <span className="text-gray-400 text-xs">No ratings yet</span>
              )}
              <Link href={`/equipment/${id}/reviews`}
                className="text-xs text-[#0B215E] font-semibold hover:underline ml-1">
                {reviewCount > 0 ? `(${reviewCount} review${reviewCount > 1 ? "s" : ""})` : "Write a review"}
              </Link>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${equipment.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
              {equipment.isActive ? "Available" : "Unavailable"}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <span className="text-gray-600">Hourly:</span>
            <span className="text-[#FF5C00] font-bold">Rwf {Number(equipment.hourlyRate).toLocaleString()} / hr</span>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <span className="text-gray-600">Daily:</span>
            <span className="text-gray-700 font-semibold">Rwf {Number(equipment.dailyRate || equipment.hourlyRate * 8).toLocaleString()} / day</span>
          </div>
          {equipment.maxRentalPeriod && (
            <div className="flex flex-wrap gap-4 items-center mt-1">
              <span className="text-gray-600">Max rental:</span>
              <span className="text-[#FF5C00] font-semibold text-sm">{equipment.maxRentalPeriod}</span>
            </div>
          )}
        </div>

        {/* ── Category ── */}
        <div className="text-sm mb-3">
          <span className="text-gray-600">Category: </span>
          <span className="text-[#0B215E] font-bold">{equipment.category}</span>
        </div>

        {/* ── Description ── */}
        <div className="text-sm text-gray-600 mb-4 leading-relaxed">
          <span className="font-bold text-gray-800">Description: </span>
          {equipment.description}
        </div>

        {/* ── Owner Info ── */}
        <div className="text-sm space-y-1 mb-5">
          <p className="font-bold text-gray-900">
            Owner:{" "}
            <span className="font-normal">
              {equipment.owner?.firstName} {equipment.owner?.lastName}
            </span>
          </p>
          <p>
            <span className="font-bold text-gray-900">Address: </span>
            <span className="text-[#0B215E]">{equipment.location}</span>
          </p>
          <p>
            <span className="font-bold text-gray-900">Distance: </span>
            <span className="text-[#FF5C00] font-semibold">
              4.2Km,&nbsp;20min Walking
            </span>
          </p>
        </div>

        {/* ── Image Gallery ── */}
        <div className="mb-8">
          {allImages.length > 0 ? (
            <>
              {/* Main display */}
              <div className="w-full h-64 rounded-xl overflow-hidden mb-3 bg-[#D9D9D9]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedImage || allImages[0]}
                  alt={equipment.title}
                  className="w-full h-full object-cover transition-opacity duration-200"
                />
              </div>
              {/* Thumbnails */}
              <div className="grid grid-cols-4 gap-2">
                {allImages.slice(0, 4).map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(img)}
                    className={`h-16 w-full rounded-md overflow-hidden border-2 transition-all ${
                      selectedImage === img
                        ? "border-[#0B215E] scale-95"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="bg-[#D9D9D9] w-full h-64 rounded-xl mb-3 flex items-center justify-center text-gray-400 text-sm">
                No image available
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-[#D9D9D9] h-16 rounded-md" />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Similar Equipment ── */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Find similar equips
        </h2>
        {similarItems.length === 0 ? (
          <p className="text-gray-400 text-sm mb-8">
            No similar equipment found.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 mb-8">
            {similarItems.map((item: any) => (
              <Link
                key={item.id}
                href={`/equipment/${item.id}`}
                className="block bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="h-32 w-full relative bg-[#D9D9D9]">
                  {item.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#D9D9D9]" />
                  )}
                  <span className="absolute top-2 left-2 text-[#0B215E] font-bold text-xs bg-white/80 backdrop-blur-sm rounded px-1 py-0.5">
                    {item.category}
                  </span>
                  <span className="absolute top-2 right-2 text-yellow-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </div>
                <div className="p-2">
                  <h3 className="font-bold text-sm text-gray-900 truncate">
                    {item.title}
                  </h3>
                  <div className="flex flex-col gap-1">
                    <p className="text-[#FF5C00] font-bold text-sm">
                      Rwf {Number(item.hourlyRate || 0).toLocaleString()} / hr
                    </p>
                    <p className="text-gray-700 text-xs">
                      Rwf {Number(item.dailyRate || item.hourlyRate * 8 || 0).toLocaleString()} / day
                    </p>
                    {item.maxRentalPeriod && <p className="text-[#FF5C00] text-xs font-semibold">Max: {item.maxRentalPeriod}</p>}
                  </div>
                  <p className="text-gray-500 text-xs line-clamp-2 leading-tight mt-0.5">
                    {item.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomNav />

      {/* ── Add to Cart Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl p-6 pb-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Select Rental Period
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Rental type toggle */}
            <div className="flex w-full border rounded-lg overflow-hidden border-gray-200 mb-4">
              <button
                onClick={() => setRentalType("daily")}
                className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                  rentalType === "daily"
                    ? "bg-[#0B215E] text-white"
                    : "bg-white text-gray-600"
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setRentalType("hourly")}
                className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                  rentalType === "hourly"
                    ? "bg-[#0B215E] text-white"
                    : "bg-white text-gray-600"
                }`}
              >
                Hourly
              </button>
            </div>

            {/* Quantity selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 rounded-md border border-gray-300 flex items-center justify-center text-gray-700 font-bold hover:bg-gray-100 transition-colors"
                >
                  −
                </button>
                <span className="text-xl font-bold text-gray-900 w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-9 h-9 rounded-md border border-gray-300 flex items-center justify-center text-gray-700 font-bold hover:bg-gray-100 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start {rentalType === "hourly" ? "Date & Time" : "Date"}
                </label>
                <input
                  type={rentalType === "hourly" ? "datetime-local" : "date"}
                  value={startDate}
                  min={startMin}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End {rentalType === "hourly" ? "Date & Time" : "Date"}
                </label>
                <input
                  type={rentalType === "hourly" ? "datetime-local" : "date"}
                  value={endDate}
                  min={endMin}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
              <p className="font-semibold text-gray-900 mb-2">Booked periods</p>
              {bookedPeriods.length === 0 ? (
                <p className="text-gray-500">No current bookings for this equipment.</p>
              ) : (
                <div className="space-y-2">
                  {bookedPeriods.map((period, index) => (
                    <div key={index} className="flex flex-col gap-1 rounded-md border border-gray-200 p-2 bg-white">
                      <span className="text-xs text-gray-500">Booked</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {new Date(period.startDate).toLocaleString()} — {new Date(period.endDate).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {startDate && endDate && calcTotal() > 0 && (
              <div className="bg-blue-50 rounded-lg p-3 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-semibold text-gray-900">{quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-semibold text-gray-900">
                    {getTimeline()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rate:</span>
                  <span className="font-semibold text-gray-900">
                    Rwf {rate}/{rentalType === "hourly" ? "hr" : "day"}
                  </span>
                </div>
                <div className="flex justify-between border-t border-blue-100 mt-2 pt-2">
                  <span className="text-gray-800 font-bold">Total:</span>
                  <span className="font-bold text-[#FF5C00]">Rwf {calcTotal()}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleConfirmAddToCart}
              className="w-full bg-[#0B215E] text-white py-3 rounded-md font-semibold text-sm hover:bg-blue-900 transition-colors"
            >
              Add to Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

