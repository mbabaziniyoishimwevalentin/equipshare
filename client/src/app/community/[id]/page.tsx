"use client";
import { API_BASE } from "@/lib/config";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import OwnerBottomNav from "@/components/OwnerBottomNav";

type Tab = "feed" | "meetups" | "events" | "tips" | "suggestions" | "members";

export default function CommunityDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const [community, setCommunity] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("feed");

  const [showMeetupForm, setShowMeetupForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showTipForm, setShowTipForm] = useState(false);
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [commentBodies, setCommentBodies] = useState<Record<number, string>>({});

  const fetchCommunity = async () => {
    const res = await fetch(`${API_BASE}/api/community/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setCommunity(await res.json());
  };

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    (async () => {
      const meRes = await fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (meRes.ok) setUser(await meRes.json());
      await fetchCommunity();
      setLoading(false);
    })();
  }, [id]);

  const postFormData = async (url: string, data: FormData) => {
    const res = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: data });
    return res;
  };

  const postJson = async (url: string, body: any) => {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    return res;
  };

  const handleCreateMeetup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const res = await postFormData(`${API_BASE}/api/community/${id}/meetups`, fd);
    if (res.ok) { setShowMeetupForm(false); await fetchCommunity(); } else { const d = await res.json(); alert(d.error || "Failed"); }
    setSubmitting(false);
  };

  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const res = await postFormData(`${API_BASE}/api/community/${id}/events`, fd);
    if (res.ok) { setShowEventForm(false); await fetchCommunity(); } else { const d = await res.json(); alert(d.error || "Failed"); }
    setSubmitting(false);
  };

  const handleCreateTip = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const res = await postFormData(`${API_BASE}/api/community/${id}/tips`, fd);
    if (res.ok) { setShowTipForm(false); await fetchCommunity(); } else { const d = await res.json(); alert(d.error || "Failed"); }
    setSubmitting(false);
  };

  const handleCreateSuggestion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const res = await postFormData(`${API_BASE}/api/community/${id}/suggestions`, fd);
    if (res.ok) { setShowSuggestionForm(false); await fetchCommunity(); } else { const d = await res.json(); alert(d.error || "Failed"); }
    setSubmitting(false);
  };

  const handleRsvpMeetup = async (meetupId: number) => {
    const res = await postJson(`${API_BASE}/api/community/${id}/meetups/${meetupId}/rsvp`, {});
    if (res.ok) await fetchCommunity(); else { const d = await res.json(); alert(d.error || "Failed"); }
  };

  const handleRsvpEvent = async (eventId: number) => {
    const res = await postJson(`${API_BASE}/api/community/${id}/events/${eventId}/rsvp`, {});
    if (res.ok) await fetchCommunity(); else { const d = await res.json(); alert(d.error || "Failed"); }
  };

  const handleLikeTip = async (tipId: number) => {
    await postJson(`${API_BASE}/api/community/${id}/tips/${tipId}/like`, {});
    await fetchCommunity();
  };

  const handleComment = async (tipId: number) => {
    const body = commentBodies[tipId]?.trim();
    if (!body) return;
    const res = await postJson(`${API_BASE}/api/community/${id}/tips/${tipId}/comments`, { body });
    if (res.ok) { setCommentBodies((prev) => ({ ...prev, [tipId]: "" })); await fetchCommunity(); }
  };

  const handleRsvpAction = async (rsvpId: number, status: string) => {
    const reason = status === "REJECTED" ? prompt("Reason for rejection:") : "";
    const res = await fetch(`${API_BASE}/api/community/rsvps/${rsvpId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, reason }),
    });
    if (res.ok) await fetchCommunity();
  };

  const handleJoin = async () => {
    const res = await postJson(`${API_BASE}/api/community/${id}/join`, {});
    if (res.ok) await fetchCommunity();
  };

  const handleLeave = async () => {
    const res = await postJson(`${API_BASE}/api/community/${id}/leave`, {});
    if (res.ok) await fetchCommunity();
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#0B215E] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!community) return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center text-sm text-gray-500">Community not found</div>
  );

  const isOwner = community.isOwner;
  const isMember = community.isMember;
  const pendingRsvps = community.rsvps?.filter((r: any) => r.status === "PENDING") || [];

  const tabs: { key: Tab; label: string }[] = [
    { key: "feed", label: "Feed" },
    { key: "meetups", label: "Meetups" },
    { key: "events", label: "Events" },
    { key: "tips", label: "Tips" },
    { key: "suggestions", label: "Suggestions" },
    { key: "members", label: "Members" },
  ];

  const inputClass = "w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#0B215E] bg-white";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1";
  const btnClass = "bg-[#0B215E] text-white rounded-xl py-3 text-sm font-bold hover:bg-blue-900 transition-colors disabled:opacity-60";

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-24">
      <div className="bg-[#0B215E] px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()} className="text-white"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg></button>
          <h1 className="text-xl font-bold text-white truncate">{community.name}</h1>
          {isOwner && <span className="text-[10px] bg-orange-500 text-white font-semibold px-2 py-0.5 rounded-full shrink-0">Admin</span>}
        </div>
        <p className="text-blue-200 text-xs">{community.members?.length || 0} members</p>
        {!isMember && !isOwner && (
          <button onClick={handleJoin} className="mt-3 bg-white text-[#0B215E] text-sm font-bold px-6 py-2 rounded-full hover:bg-blue-50 transition-colors">Join Community</button>
        )}
      </div>

      <div className="bg-white border-b border-gray-200 px-4 flex overflow-x-auto gap-1 sticky top-0 z-40">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`shrink-0 px-3 py-3 text-xs font-semibold border-b-2 transition-colors ${tab === t.key ? "border-[#0B215E] text-[#0B215E]" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 space-y-4">

        {tab === "feed" && (
          <>
            {isOwner && (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowMeetupForm(true)} className="bg-white rounded-xl p-4 shadow-sm text-center hover:shadow-md">
                  <p className="font-bold text-sm text-gray-900">Create Meetup</p>
                  <p className="text-xs text-gray-500 mt-1">Organize gatherings</p>
                </button>
                <button onClick={() => setShowEventForm(true)} className="bg-white rounded-xl p-4 shadow-sm text-center hover:shadow-md">
                  <p className="font-bold text-sm text-gray-900">Create Event</p>
                  <p className="text-xs text-gray-500 mt-1">Rental drives</p>
                </button>
              </div>
            )}
            <button onClick={() => setShowTipForm(true)} className="w-full bg-white rounded-xl p-3 shadow-sm text-center hover:shadow-md">
              <p className="font-bold text-sm text-gray-900">Share a Tip</p>
              <p className="text-xs text-gray-500 mt-1">Knowledge sharing</p>
            </button>
            <button onClick={() => setShowSuggestionForm(true)} className="w-full bg-white rounded-xl p-3 shadow-sm text-center hover:shadow-md">
              <p className="font-bold text-sm text-gray-900">Make a Suggestion</p>
              <p className="text-xs text-gray-500 mt-1">Help improve the community</p>
            </button>

            {pendingRsvps.length > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-[#FF5C00]">
                <h2 className="font-bold text-sm text-gray-900 mb-3">Pending RSVPs ({pendingRsvps.length})</h2>
                {pendingRsvps.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">{r.user?.firstName} {r.user?.lastName}</p>
                      <p className="text-xs text-gray-500">{r.meetup?.title || r.event?.title}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleRsvpAction(r.id, "ACCEPTED")} className="text-xs bg-[#10b981] text-white px-3 py-1.5 rounded-full font-semibold">Accept</button>
                      <button onClick={() => handleRsvpAction(r.id, "REJECTED")} className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-full font-semibold">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(() => {
              const items: any[] = [];
              (community.meetups || []).forEach((m: any) => items.push({ type: "meetup", data: m, createdAt: m.date }));
              (community.events || []).forEach((e: any) => items.push({ type: "event", data: e, createdAt: e.date }));
              (community.tips || []).forEach((t: any) => items.push({ type: "tip", data: t, createdAt: t.createdAt }));
              items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
              return items.slice(0, 10).map((item, i) => {
                if (item.type === "meetup") {
                  const m = item.data;
                  return (
                    <div key={`m-${m.id}`} className="bg-white rounded-xl p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] bg-[#FF5C00]/10 text-[#FF5C00] font-semibold px-2 py-0.5 rounded-full">Meetup</span>
                        <span className="text-[10px] text-gray-400">{new Date(m.date).toLocaleDateString()}</span>
                      </div>
                      <h3 className="font-bold text-sm text-gray-900">{m.title}</h3>
                      {m.image && <img src={`${API_BASE}${m.image}`} alt={m.title} className="w-full h-40 object-cover rounded-lg my-2" />}
                      <p className="text-sm text-gray-700">{m.description}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <span>{m.location}</span>
                        <span>Â·</span>
                        <span>{m.rsvpCount} RSVPs</span>
                      </div>
                    </div>
                  );
                }
                if (item.type === "event") {
                  const e = item.data;
                  return (
                    <div key={`ev-${e.id}`} className="bg-white rounded-xl p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] bg-purple-50 text-[#c700ff] font-semibold px-2 py-0.5 rounded-full">Event</span>
                        <span className="text-[10px] text-gray-400">{new Date(e.date).toLocaleDateString()}</span>
                      </div>
                      <h3 className="font-bold text-sm text-gray-900">{e.title}</h3>
                      {e.image && <img src={`${API_BASE}${e.image}`} alt={e.title} className="w-full h-40 object-cover rounded-lg my-2" />}
                      <p className="text-sm text-gray-700">{e.description}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <span>{e.location}</span>
                        <span>Â·</span>
                        <span>{e.rsvpCount} RSVPs</span>
                      </div>
                    </div>
                  );
                }
                if (item.type === "tip") {
                  const t = item.data;
                  return (
                    <div key={`t-${t.id}`} className="bg-white rounded-xl p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] bg-emerald-50 text-[#10b981] font-semibold px-2 py-0.5 rounded-full">Tip</span>
                        <span className="text-[10px] text-gray-400">{t.category}</span>
                        <span className="text-[10px] text-gray-400">by {t.author?.firstName}</span>
                      </div>
                      <h3 className="font-bold text-sm text-gray-900">{t.title}</h3>
                      {t.image && <img src={`${API_BASE}${t.image}`} alt={t.title} className="w-full h-48 object-cover rounded-lg my-2" />}
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{t.body}</p>

                      <div className="flex items-center gap-4 mt-3 mb-2">
                        <button onClick={() => handleLikeTip(t.id)} className={`flex items-center gap-1 text-xs font-semibold ${t.isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" fill={t.isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                          </svg>
                          {t.likeCount} {t.likeCount === 1 ? "like" : "likes"}
                        </button>
                      </div>

                      <div className="space-y-2 mb-2">
                        {t.comments?.map((c: any) => (
                          <div key={c.id} className="bg-gray-50 rounded-lg px-3 py-2 text-sm">
                            <span className="font-semibold text-gray-900 text-xs">{c.user?.firstName}: </span>
                            <span className="text-gray-700">{c.body}</span>
                          </div>
                        ))}
                      </div>

                      {isMember && (
                        <div className="flex gap-2">
                          <input value={commentBodies[t.id] || ""} onChange={(e) => setCommentBodies((p) => ({ ...p, [t.id]: e.target.value }))}
                            placeholder="Add a comment..." className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#10b981]" />
                          <button onClick={() => handleComment(t.id)} className="bg-[#10b981] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-emerald-700">Post</button>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              });
            })()}
          </>
        )}

        {tab === "meetups" && (
          <>
            {isOwner && (
              <button onClick={() => setShowMeetupForm(!showMeetupForm)}
                className="w-full bg-white rounded-xl p-3 shadow-sm font-bold text-sm text-[#0B215E] flex items-center justify-center gap-2 hover:bg-blue-50">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                {showMeetupForm ? "Cancel" : "Create Meetup"}
              </button>
            )}
            {showMeetupForm && (
              <form onSubmit={handleCreateMeetup} className="bg-white rounded-xl p-4 shadow-sm space-y-4">
                <div><label className={labelClass}>Title</label><input name="title" required className={inputClass} /></div>
                <div><label className={labelClass}>Description</label><textarea name="description" required rows={3} className={inputClass} /></div>
                <div><label className={labelClass}>Location</label><input name="location" required className={inputClass} /></div>
                <div><label className={labelClass}>Date & Time</label><input type="datetime-local" name="date" required className={inputClass} /></div>
                <div><label className={labelClass}>Image</label><input type="file" name="image" accept="image/*" className={inputClass} /></div>
                <div><label className={labelClass}>Max Attendees</label><input type="number" name="maxAttendees" min="1" className={inputClass} /></div>
                <button disabled={submitting} className={btnClass}>{submitting ? "Creating..." : "Create Meetup"}</button>
              </form>
            )}
            {community.meetups?.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No meetups yet.</p>
            ) : (
              community.meetups?.map((m: any) => (
                <div key={m.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-sm text-gray-900">{m.title}</h3>
                    <span className="text-xs bg-[#FF5C00]/10 text-[#FF5C00] font-semibold px-2 py-0.5 rounded-full shrink-0">{new Date(m.date).toLocaleDateString()}</span>
                  </div>
                  {m.image && <img src={`${API_BASE}${m.image}`} alt={m.title} className="w-full h-40 object-cover rounded-lg mb-2" />}
                  <p className="text-sm text-gray-700 mb-2">{m.description}</p>
                  <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                    <span>{m.location} Â· {m.rsvpCount} RSVPs{m.maxAttendees ? ` / ${m.maxAttendees}` : ""}</span>
                    <span>by {m.organizer?.firstName}</span>
                  </div>
                  {!isOwner && isMember && (
                    m.userRsvp ? (
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 rounded-full px-3 py-1.5 inline-block">
                        {m.userRsvp.status === "PENDING" ? "Pending" : m.userRsvp.status === "ACCEPTED" ? "Accepted âœ“" : `Rejected`}
                      </span>
                    ) : (
                      <button onClick={() => handleRsvpMeetup(m.id)} className="text-xs bg-[#0B215E] text-white px-4 py-1.5 rounded-full font-semibold">RSVP</button>
                    )
                  )}
                </div>
              ))
            )}
          </>
        )}

        {tab === "events" && (
          <>
            {isOwner && (
              <button onClick={() => setShowEventForm(!showEventForm)}
                className="w-full bg-white rounded-xl p-3 shadow-sm font-bold text-sm text-[#c700ff] flex items-center justify-center gap-2 hover:bg-purple-50">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                {showEventForm ? "Cancel" : "Create Event"}
              </button>
            )}
            {showEventForm && (
              <form onSubmit={handleCreateEvent} className="bg-white rounded-xl p-4 shadow-sm space-y-4">
                <div><label className={labelClass}>Title</label><input name="title" required className={inputClass} /></div>
                <div><label className={labelClass}>Description</label><textarea name="description" required rows={3} className={inputClass} /></div>
                <div><label className={labelClass}>Location</label><input name="location" required className={inputClass} /></div>
                <div><label className={labelClass}>Date & Time</label><input type="datetime-local" name="date" required className={inputClass} /></div>
                <div><label className={labelClass}>Image</label><input type="file" name="image" accept="image/*" className={inputClass} /></div>
                <div><label className={labelClass}>Max Attendees</label><input type="number" name="maxAttendees" min="1" className={inputClass} /></div>
                <button disabled={submitting} className="w-full bg-[#c700ff] text-white rounded-xl py-3 text-sm font-bold hover:bg-purple-700 disabled:opacity-60">{submitting ? "Creating..." : "Create Event"}</button>
              </form>
            )}
            {community.events?.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No events yet.</p>
            ) : (
              community.events?.map((e: any) => (
                <div key={e.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-sm text-gray-900">{e.title}</h3>
                    <span className="text-xs bg-purple-50 text-[#c700ff] font-semibold px-2 py-0.5 rounded-full shrink-0">{new Date(e.date).toLocaleDateString()}</span>
                  </div>
                  {e.image && <img src={`${API_BASE}${e.image}`} alt={e.title} className="w-full h-40 object-cover rounded-lg mb-2" />}
                  <p className="text-sm text-gray-700 mb-2">{e.description}</p>
                  <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                    <span>{e.location} Â· {e.rsvpCount} RSVPs{e.maxAttendees ? ` / ${e.maxAttendees}` : ""}</span>
                    <span>by {e.organizer?.firstName}</span>
                  </div>
                  {!isOwner && isMember && (
                    e.userRsvp ? (
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 rounded-full px-3 py-1.5 inline-block">
                        {e.userRsvp.status === "PENDING" ? "Pending" : e.userRsvp.status === "ACCEPTED" ? "Accepted âœ“" : "Rejected"}
                      </span>
                    ) : (
                      <button onClick={() => handleRsvpEvent(e.id)} className="text-xs bg-[#c700ff] text-white px-4 py-1.5 rounded-full font-semibold">RSVP</button>
                    )
                  )}
                </div>
              ))
            )}
          </>
        )}

        {tab === "tips" && (
          <>
            <button onClick={() => setShowTipForm(!showTipForm)}
              className="w-full bg-white rounded-xl p-3 shadow-sm font-bold text-sm text-[#10b981] flex items-center justify-center gap-2 hover:bg-emerald-50">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              {showTipForm ? "Cancel" : "Share a Tip"}
            </button>
            {showTipForm && (
              <form onSubmit={handleCreateTip} className="bg-white rounded-xl p-4 shadow-sm space-y-4">
                <div><label className={labelClass}>Title</label><input name="title" required className={inputClass} /></div>
                <div><label className={labelClass}>Tip</label><textarea name="body" required rows={4} className={inputClass} /></div>
                <div><label className={labelClass}>Category</label>
                  <select name="category" className={inputClass}>
                    {["General", "Renting", "Lending", "Safety", "Maintenance"].map((c) => <option key={c} value={c} className="text-gray-900">{c}</option>)}
                  </select>
                </div>
                <div><label className={labelClass}>Image (optional)</label><input type="file" name="image" accept="image/*" className={inputClass} /></div>
                <button disabled={submitting} className="w-full bg-[#10b981] text-white rounded-xl py-3 text-sm font-bold hover:bg-emerald-700 disabled:opacity-60">{submitting ? "Sharing..." : "Share Tip"}</button>
              </form>
            )}
            {community.tips?.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No tips yet.</p>
            ) : (
              community.tips?.map((t: any) => (
                <div key={t.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-sm text-gray-900">{t.title}</h3>
                    <span className="text-[10px] bg-emerald-50 text-[#10b981] font-semibold px-2 py-0.5 rounded-full shrink-0">{t.category}</span>
                  </div>
                  {t.image && <img src={`${API_BASE}${t.image}`} alt={t.title} className="w-full h-48 object-cover rounded-lg my-2" />}
                  <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">{t.body}</p>
                  <p className="text-xs text-gray-400 mb-2">by {t.author?.firstName} {t.author?.lastName}</p>

                  <div className="flex items-center gap-4 mb-2">
                    <button onClick={() => handleLikeTip(t.id)} className={`flex items-center gap-1 text-xs font-semibold ${t.isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill={t.isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                      </svg>
                      {t.likeCount}
                    </button>
                  </div>

                  <div className="space-y-2 mb-2">
                    {t.comments?.map((c: any) => (
                      <div key={c.id} className="bg-gray-50 rounded-lg px-3 py-2 text-sm">
                        <span className="font-semibold text-gray-900 text-xs">{c.user?.firstName}: </span>
                        <span className="text-gray-700">{c.body}</span>
                      </div>
                    ))}
                  </div>

                  {isMember && (
                    <div className="flex gap-2">
                      <input value={commentBodies[t.id] || ""} onChange={(e) => setCommentBodies((p) => ({ ...p, [t.id]: e.target.value }))}
                        placeholder="Add a comment..." className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#10b981]" />
                      <button onClick={() => handleComment(t.id)} className="bg-[#10b981] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-emerald-700">Post</button>
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-2 text-[10px] text-gray-400">
                    <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                    {(t.authorId === user?.id || user?.role === "ADMIN") && (
                      <button onClick={async () => { await fetch(`${API_BASE}/api/community/${id}/tips/${t.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }); await fetchCommunity(); }}
                        className="text-red-500 font-semibold">Delete</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {tab === "suggestions" && (
          <>
            <button onClick={() => setShowSuggestionForm(!showSuggestionForm)}
              className="w-full bg-white rounded-xl p-3 shadow-sm font-bold text-sm text-[#0B5460] flex items-center justify-center gap-2 hover:bg-teal-50">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              {showSuggestionForm ? "Cancel" : "Make a Suggestion"}
            </button>
            {showSuggestionForm && (
              <form onSubmit={handleCreateSuggestion} className="bg-white rounded-xl p-4 shadow-sm space-y-4">
                <div><label className={labelClass}>Your Feedback</label>
                  <textarea name="body" required rows={4} placeholder="Share your feedback, ideas, or suggestions..." className={inputClass} /></div>
                <button disabled={submitting} className="w-full bg-[#0B5460] text-white rounded-xl py-3 text-sm font-bold hover:bg-teal-800 disabled:opacity-60">{submitting ? "Submitting..." : "Submit Suggestion"}</button>
              </form>
            )}
            {community.suggestions?.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No suggestions yet.</p>
            ) : (
              community.suggestions?.map((s: any) => (
                <div key={s.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{s.body}</p>
                    {s.addressed && <span className="text-[10px] bg-green-50 text-green-700 font-semibold px-2 py-0.5 rounded-full shrink-0 ml-2">Addressed</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{s.user?.firstName} {s.user?.lastName} Â· {new Date(s.createdAt).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </>
        )}

        {tab === "members" && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="font-bold text-sm text-gray-900 mb-3">Members ({community.members?.length || 0})</h2>
            {community.members?.length === 0 ? (
              <p className="text-sm text-gray-400">No members yet.</p>
            ) : (
              <div className="space-y-2">
                {community.members?.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-900">{m.user?.firstName} {m.user?.lastName}</span>
                    {m.userId === community.ownerId && <span className="text-[10px] bg-[#0B215E]/10 text-[#0B215E] font-semibold px-2 py-0.5 rounded-full">Admin</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
      {user?.role === "OWNER" ? <OwnerBottomNav /> : <BottomNav />}
    </div>
  );
}




