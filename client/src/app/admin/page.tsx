"use client";
import { API_BASE } from "@/lib/config";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  phone?: string;
}

interface Equipment {
  id: number;
  title: string;
  category: string;
  hourlyRate: number;
  dailyRate: number;
  isActive: boolean;
  location: string;
  images?: string[];
  maxRentalPeriod?: string | null;
  owner: { firstName: string; lastName: string };
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  renter: { firstName: string; lastName: string; email: string };
  items: { id: number; equipment: { title: string }; quantity: number; totalAmount: number }[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<"users" | "equipment" | "orders" | "sales">("users");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token || !userData) { router.push("/login"); return; }
    const parsed = JSON.parse(userData);
    if (parsed.role !== "ADMIN") { router.push("/login"); return; }
    setUser(parsed);
    fetchAll(token);
  }, [router]);

  const fetchAll = async (token: string) => {
    try {
      const [uRes, eRes, oRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/admin/equipments`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/admin/orders`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (uRes.ok) setUsers(await uRes.json());
      if (eRes.ok) setEquipments(await eRes.json());
      if (oRes.ok) setOrders(await oRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [orderDateFrom, setOrderDateFrom] = useState("");
  const [orderDateTo, setOrderDateTo] = useState("");
  const [salesDateFrom, setSalesDateFrom] = useState("");
  const [salesDateTo, setSalesDateTo] = useState("");
  const [salesPeriodLabel, setSalesPeriodLabel] = useState("");

  const setSalesPreset = (preset: "daily" | "weekly" | "monthly") => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    if (preset === "daily") {
      setSalesDateFrom(today);
      setSalesDateTo(today);
      setSalesPeriodLabel("Daily");
    } else if (preset === "weekly") {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      setSalesDateFrom(weekStart.toISOString().split("T")[0]);
      setSalesDateTo(today);
      setSalesPeriodLabel("Weekly");
    } else if (preset === "monthly") {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      setSalesDateFrom(monthStart.toISOString().split("T")[0]);
      setSalesDateTo(today);
      setSalesPeriodLabel("Monthly");
    }
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "RENTER",
    phone: "",
    isVerified: false,
  });

  const handleOpenAdd = () => {
    setEditingUser(null);
    setUserForm({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "RENTER",
      phone: "",
      isVerified: false,
    });
    setShowUserModal(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setUserForm({
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      password: "",
      role: u.role,
      phone: u.phone || "",
      isVerified: u.isVerified,
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      if (editingUser) {
        const res = await fetch(`${API_BASE}/api/admin/users/${editingUser.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            firstName: userForm.firstName,
            lastName: userForm.lastName,
            email: userForm.email,
            role: userForm.role,
            phone: userForm.phone,
            isVerified: userForm.isVerified,
          }),
        });
        if (res.ok) {
          const updated = await res.json();
          setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? updated : u)));
          setShowUserModal(false);
        } else {
          alert("Failed to save changes");
        }
      } else {
        const res = await fetch(`${API_BASE}/api/admin/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(userForm),
        });
        if (res.ok) {
          const newUser = await res.json();
          setUsers((prev) => [newUser, ...prev]);
          setShowUserModal(false);
        } else {
          alert("Failed to create user");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to delete user");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    const dateStr = new Date().toLocaleString();
    const rows = users.map(u => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px; font-size: 12px;">${u.firstName} ${u.lastName}</td>
        <td style="border: 1px solid #ddd; padding: 8px; font-size: 12px;">${u.email}</td>
        <td style="border: 1px solid #ddd; padding: 8px; font-size: 12px;">${u.role}</td>
        <td style="border: 1px solid #ddd; padding: 8px; font-size: 12px;">${u.phone || 'â€”'}</td>
        <td style="border: 1px solid #ddd; padding: 8px; font-size: 12px; font-weight: bold; color: ${u.isVerified ? 'green' : 'orange'}">${u.isVerified ? 'Verified' : 'Unverified'}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>EquipShare Platform Report</title>
          <style>
            body { font-family: sans-serif; color: #333; margin: 40px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0B215E; padding-bottom: 20px; margin-bottom: 30px; }
            .logo-sec { display: flex; align-items: center; gap: 10px; }
            .system-logo { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, #0B215E, #c700ff); }
            .company-name { font-size: 20px; font-weight: bold; color: #0B215E; }
            .meta { text-align: right; font-size: 12px; color: #666; }
            .title { font-size: 18px; font-weight: bold; text-transform: uppercase; color: #111; margin-bottom: 20px; }
            .stat-card { border: 1px solid #eee; padding: 15px; border-radius: 8px; text-align: center; background: #fafafa; }
            .stat-val { font-size: 18px; font-weight: bold; color: #0B215E; margin: 0; }
            .stat-lbl { font-size: 10px; color: #777; margin: 5px 0 0 0; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #0B215E; color: white; border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-sec">
              <div class="system-logo"></div>
              <span class="company-name">EQUIPSHARE</span>
            </div>
            <div class="meta">
              <p style="margin: 0; font-weight: bold;">SYSTEM AUDIT REPORT</p>
              <p style="margin: 3px 0 0 0;">Run Date: ${dateStr}</p>
            </div>
          </div>
          
          <h2 class="title">Platform User Database & Audit</h2>
          
          <div style="display: flex; gap: 20px; margin-bottom: 30px;">
            <div class="stat-card" style="flex: 1;">
              <p class="stat-val">${users.length}</p>
              <p class="stat-lbl">Total Users</p>
            </div>
            <div class="stat-card" style="flex: 1;">
              <p class="stat-val">${equipments.length}</p>
              <p class="stat-lbl">Total Listings</p>
            </div>
            <div class="stat-card" style="flex: 1;">
              <p class="stat-val">${orders.length}</p>
              <p class="stat-lbl">Total Orders</p>
            </div>
            <div class="stat-card" style="flex: 1;">
              <p class="stat-val">Rwf ${totalRevenue.toFixed(0)}</p>
              <p class="stat-lbl">Platform Revenue</p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportEquipPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const dateStr = new Date().toLocaleString();
    const rows = filteredEquip.map(eq => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px; font-size: 12px;"><img src="${eq.images?.[0] || ''}" width="40" height="40" style="border-radius:6px;object-fit:cover;" /></td>
        <td style="border: 1px solid #ddd; padding: 8px; font-size: 12px;">${eq.title}</td>
        <td style="border: 1px solid #ddd; padding: 8px; font-size: 12px;">${eq.category}</td>
        <td style="border: 1px solid #ddd; padding: 8px; font-size: 12px;">Rwf ${eq.hourlyRate}</td>
        <td style="border: 1px solid #ddd; padding: 8px; font-size: 12px;">Rwf ${eq.dailyRate || 'â€”'}</td>
        <td style="border: 1px solid #ddd; padding: 8px; font-size: 12px;">${eq.maxRentalPeriod || 'â€”'}</td>
        <td style="border: 1px solid #ddd; padding: 8px; font-size: 12px;">${eq.location}</td>
        <td style="border: 1px solid #ddd; padding: 8px; font-size: 12px;">${eq.owner.firstName} ${eq.owner.lastName}</td>
        <td style="border: 1px solid #ddd; padding: 8px; font-size: 12px; font-weight: bold; color: ${eq.isActive ? 'green' : 'red'}">${eq.isActive ? 'Active' : 'Suspended'}</td>
      </tr>
    `).join("");
    printWindow.document.write(`
      <html><head><title>Equipment List</title>
        <style>
          body { font-family: sans-serif; color: #333; margin: 40px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0B215E; padding-bottom: 20px; margin-bottom: 30px; }
          .company-name { font-size: 20px; font-weight: bold; color: #0B215E; }
          .meta { text-align: right; font-size: 12px; color: #666; }
          .title { font-size: 18px; font-weight: bold; text-transform: uppercase; color: #111; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #0B215E; color: white; border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        </style>
      </head><body>
        <div class="header">
          <span class="company-name">EQUIPSHARE</span>
          <div class="meta"><p style="margin:0;font-weight:bold;">EQUIPMENT REPORT</p><p style="margin:3px 0 0 0;">Run Date: ${dateStr}</p></div>
        </div>
        <h2 class="title">All Equipment Listings</h2>
        <table><thead><tr>
          <th>Image</th><th>Title</th><th>Category</th><th>Hourly</th><th>Daily</th><th>Max Period</th><th>Location</th><th>Owner</th><th>Status</th>
        </tr></thead><tbody>${rows}</tbody></table>
        <script>window.onload=function(){window.print();setTimeout(function(){window.close()},500)}</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const handleExportOrdersPDF = () => {
    let filtered = [...orders];
    if (orderStatusFilter) filtered = filtered.filter(o => o.status === orderStatusFilter);
    if (orderDateFrom) filtered = filtered.filter(o => new Date(o.createdAt) >= new Date(orderDateFrom));
    if (orderDateTo) filtered = filtered.filter(o => new Date(o.createdAt) <= new Date(orderDateTo + "T23:59:59"));
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const dateStr = new Date().toLocaleString();
    const rows = filtered.map(o => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px; font-size: 12px;">#${o.orderNumber.slice(-8).toUpperCase()}</td>
        <td style="border: 1px solid #ddd; padding: 8px; font-size: 12px;">${o.renter.firstName} ${o.renter.lastName}</td>
        <td style="border: 1px solid #ddd; padding: 8px; font-size: 12px;">${o.renter.email}</td>
        <td style="border: 1px solid #ddd; padding: 8px; font-size: 12px;">${o.items.map(i => i.equipment.title).join(", ")}</td>
        <td style="border: 1px solid #ddd; padding: 8px; font-size: 12px;">Rwf ${o.totalAmount.toFixed(0)}</td>
        <td style="border: 1px solid #ddd; padding: 8px; font-size: 12px;">${new Date(o.createdAt).toLocaleDateString()}</td>
        <td style="border: 1px solid #ddd; padding: 8px; font-size: 12px; font-weight: bold;">${o.status}</td>
      </tr>
    `).join("");
    const total = filtered.reduce((s, o) => s + o.totalAmount, 0);
    printWindow.document.write(`
      <html><head><title>Orders Report</title>
        <style>
          body { font-family: sans-serif; color: #333; margin: 40px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0B215E; padding-bottom: 20px; margin-bottom: 30px; }
          .company-name { font-size: 20px; font-weight: bold; color: #0B215E; }
          .meta { text-align: right; font-size: 12px; color: #666; }
          .title { font-size: 18px; font-weight: bold; text-transform: uppercase; color: #111; margin-bottom: 10px; }
          .summary { font-size: 13px; color: #555; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #0B215E; color: white; border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          .total-row { font-weight: bold; background: #f0f4ff; }
        </style>
      </head><body>
        <div class="header">
          <span class="company-name">EQUIPSHARE</span>
          <div class="meta"><p style="margin:0;font-weight:bold;">ORDERS REPORT</p><p style="margin:3px 0 0 0;">Run Date: ${dateStr}</p></div>
        </div>
        <h2 class="title">Orders Report</h2>
        <p class="summary">${orderStatusFilter ? `Status: ${orderStatusFilter} | ` : ""}${orderDateFrom ? `From: ${orderDateFrom} | ` : ""}${orderDateTo ? `To: ${orderDateTo} | ` : ""}Total Orders: ${filtered.length}</p>
        <table><thead><tr>
          <th>Order</th><th>Renter</th><th>Email</th><th>Items</th><th>Total</th><th>Date</th><th>Status</th>
        </tr></thead><tbody>${rows}</tbody></table>
        <p style="margin-top:20px;font-size:14px;font-weight:bold;text-align:right;">Grand Total: Rwf ${total.toFixed(0)}</p>
        <script>window.onload=function(){window.print();setTimeout(function(){window.close()},500)}</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const handleToggleVerify = async (userId: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/verify`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleChange = async (userId: number, role: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleEquip = async (equipId: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/equipments/${equipId}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const updated = await res.json();
        setEquipments((prev) => prev.map((eq) => (eq.id === equipId ? updated : eq)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportSalesPDF = () => {
    const generateDate = new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    const adminName = user ? `${user.firstName} ${user.lastName}` : "Admin";
    const periodTitle = salesPeriodLabel ? `${salesPeriodLabel} Sales Report` : "Sales Report";
    const fromLabel = salesDateFrom ? new Date(salesDateFrom).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Earliest";
    const toLabel = salesDateTo ? new Date(salesDateTo).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Latest";

    let rowNum = 0;
    let grandTotal = 0;
    const rows: string[] = [];
    for (const s of filteredSales) {
      for (const o of s.orders) {
        for (const item of o.items) {
          rowNum++;
          grandTotal += Number(item.totalAmount);
          const paidBy = `${o.renter.firstName} ${o.renter.lastName}`;
          const datePaid = new Date(o.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
          rows.push(`
          <tr>
            <td class="td td-center">${rowNum}</td>
            <td class="td">${item.equipment.title}</td>
            <td class="td td-center">${item.quantity}</td>
            <td class="td amt">Rwf ${Number(item.totalAmount).toLocaleString()}</td>
            <td class="td">${paidBy}</td>
            <td class="td td-center">${datePaid}</td>
          </tr>`);
        }
      }
    }

    const html = `
      <html>
      <head>
        <title>Sales Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #334155; padding: 30px 40px; background-color: #fff; line-height: 1.4; }
          
          /* Header Styling matching image */
          .header-container { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
          .header-left { display: flex; align-items: center; gap: 10px; }
          .logo-container { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 4px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
          .logo-box-inner { width: 32px; height: 32px; border-radius: 6px; background: linear-gradient(135deg, #e11d48, #c084fc); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; }
          .org-info { line-height: 1.2; }
          .org-title { font-size: 11px; font-weight: bold; color: #1e293b; }
          .org-subtitle { font-size: 9px; color: #64748b; }
          
          .header-center { text-align: center; }
          .brand-logo-text { font-size: 18px; font-weight: 800; color: #4f46e5; letter-spacing: 1.5px; text-transform: uppercase; }
          .document-type-label { font-size: 10px; font-weight: 700; color: #1e293b; margin-top: 2px; }
          
          .header-right { text-align: right; font-size: 9px; color: #64748b; line-height: 1.4; }
          
          .horizontal-divider { border-bottom: 2px solid #5a67d8; margin: 8px 0; }
          
          .report-subtitle-centered { text-align: center; margin-bottom: 12px; }
          .report-subtitle-centered h2 { font-size: 13px; color: #4f46e5; font-weight: 700; margin-bottom: 2px; }
          .report-subtitle-centered p { font-size: 9px; color: #64748b; }

          /* Filter and stats box matching the image layout */
          .filter-stats-bar { display: flex; justify-content: space-between; align-items: center; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; margin-bottom: 15px; font-size: 10px; color: #475569; }
          .filter-item { font-weight: 500; }
          .filter-item strong { color: #1e293b; }

          /* Section header matching image */
          .section-title { font-size: 11px; font-weight: bold; color: #0f172a; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }

          /* Table Design matching image (not too wide, compact column widths) */
          table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          th { background: #5a67d8; color: white; border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
          th.center, td.td-center { text-align: center; }
          th.right, td.amt { text-align: right; }
          .td { border: 1px solid #cbd5e1; padding: 4px 5px; font-size: 9px; color: #334155; }
          .tr:nth-child(even) { background-color: #f8fafc; }
          
          /* Column width overrides — compact layout */
          .col-num { width: 5%; }
          .col-name { width: 38%; }
          .col-qty { width: 8%; }
          .col-amt { width: 17%; }
          .col-paidby { width: 17%; }
          .col-date { width: 15%; }

          /* Summary row below the table */
          .total-summary-container { display: flex; justify-content: space-between; align-items: center; border-top: 1.5px solid #cbd5e1; border-bottom: 1.5px solid #cbd5e1; padding: 8px 12px; margin-bottom: 30px; }
          .total-summary-label { font-size: 10px; font-weight: bold; color: #475569; }
          .total-summary-value { font-size: 12px; font-weight: 800; color: #1e293b; }

          /* Double signatures section matching image */
          .signatures-container { display: flex; justify-content: space-between; margin-top: 40px; }
          .signature-box { width: 42%; }
          .signature-title { font-size: 9px; font-weight: bold; color: #4f46e5; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
          .signature-details { font-size: 9px; color: #64748b; line-height: 1.5; }
          .signature-details strong { color: #1e293b; }
          .signature-space { height: 35px; }
          .sig-line { color: #333; margin-bottom: 4px; font-size: 11px; }

          /* Document Footer styling */
          .report-footer { margin-top: 50px; text-align: center; font-size: 8px; color: #94a3b8; border-top: 1px dashed #e2e8f0; padding-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header-container">
          <div class="header-left">
            <div class="logo-container">
              <div class="logo-box-inner">EQ</div>
            </div>
            <div class="org-info">
              <div class="org-title">EquipShare Ltd</div>
              <div class="org-subtitle">Kigali, Rwanda</div>
            </div>
          </div>
          
          <div class="header-center">
            <div class="brand-logo-text">EQUIPSHARE</div>
            <div class="document-type-label">Sales Report</div>
          </div>
          
          <div class="header-right">
            <div>Reporting period: ${salesPeriodLabel ? salesPeriodLabel : "All time - Present"}</div>
            <div>Generated date: ${generateDate}</div>
          </div>
        </div>

        <div class="horizontal-divider"></div>

        <div class="report-subtitle-centered">
          <h2>EquipShare Ltd — Kigali, Rwanda</h2>
          <p>Type: Sales Report</p>
        </div>

        <div class="filter-stats-bar">
          <div class="filter-item">Report Type: <strong>Sales Report</strong></div>
          <div class="filter-item">Period Filter: <strong>${fromLabel} — ${toLabel}</strong></div>
          <div class="filter-item">Total Transactions: <strong>${rowNum}</strong></div>
        </div>

        <div class="section-title">1. Sales Detail</div>

        <table>
          <thead>
            <tr>
              <th class="col-num center">#</th>
              <th class="col-name">Product Name</th>
              <th class="col-qty center">Qty</th>
              <th class="col-amt right">Amount Paid</th>
              <th class="col-paidby">Paid By</th>
              <th class="col-date center">Date</th>
            </tr>
          </thead>
          <tbody>
            ${rows.join("")}
          </tbody>
        </table>

        <div class="total-summary-container">
          <div class="total-summary-label">Total Price</div>
          <div class="total-summary-value">Rwf ${grandTotal.toLocaleString()}</div>
        </div>

        <div class="signatures-container">
          <div class="signature-box">
            <div class="signature-title">Prepared By</div>
            <div class="signature-space"></div>
            <div class="signature-details">
              <div class="sig-line">_________________________</div>
              <strong>Kobusinge Goreth</strong><br/>
              Sale Staff<br/>
              Date: ${generateDate}
            </div>
          </div>
          
          <div class="signature-box">
            <div class="signature-title">Approved By</div>
            <div class="signature-space"></div>
            <div class="signature-details">
              <div class="sig-line">_________________________</div>
              <strong>System Administrator</strong><br/>
              EquipShare Ltd<br/>
              Date: ${generateDate}
            </div>
          </div>
        </div>

        <div class="report-footer">
          Generated on: ${generateDate} | Generated by: ${user?.email || "admin@equipshare.com"} | © 2026 EquipShare — Kigali, Rwanda. Confidential.
        </div>
      </body>
      </html>
    `;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const filename = `equipshare_sales_${salesPeriodLabel ? salesPeriodLabel.toLowerCase() + "_" : ""}${new Date().toISOString().split("T")[0]}.html`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN": return "bg-purple-100 text-purple-700";
      case "OWNER": return "bg-blue-100 text-blue-700";
      case "RENTER": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-orange-100 text-orange-700";
      case "PROCESSING": return "bg-purple-100 text-purple-700";
      case "COMPLETED": return "bg-green-100 text-green-700";
      case "CANCELED": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const owners = users.filter((u) => u.role === "OWNER");
  const renters = users.filter((u) => u.role === "RENTER");

  // Statistics
  const completedOrders = orders.filter((o) => o.status === "COMPLETED");
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const dailySales = completedOrders
    .filter((o) => new Date(o.createdAt) >= startOfDay)
    .reduce((s, o) => s + o.totalAmount, 0);
  const weeklySales = completedOrders
    .filter((o) => new Date(o.createdAt) >= startOfWeek)
    .reduce((s, o) => s + o.totalAmount, 0);
  const monthlySales = completedOrders
    .filter((o) => new Date(o.createdAt) >= startOfMonth)
    .reduce((s, o) => s + o.totalAmount, 0);

  // Filters
  const filteredUsers = users.filter(
    (u) =>
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEquip = equipments.filter(
    (e) =>
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sales data grouped by date
  const salesByDate: { date: string; orders: Order[]; total: number }[] = (() => {
    const map = new Map<string, Order[]>();
    for (const o of completedOrders) {
      const d = new Date(o.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(o);
    }
    return Array.from(map.entries())
      .map(([date, orders]) => ({ date, orders, total: orders.reduce((s, o) => s + o.totalAmount, 0) }))
      .sort((a, b) => new Date(b.orders[0].createdAt).getTime() - new Date(a.orders[0].createdAt).getTime());
  })();

  const filteredSales = salesByDate.filter((s) => {
    const d = new Date(s.orders[0].createdAt);
    if (salesDateFrom && d < new Date(salesDateFrom)) return false;
    if (salesDateTo && d > new Date(salesDateTo + "T23:59:59")) return false;
    return true;
  });

  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter && o.status !== orderStatusFilter) return false;
    if (orderDateFrom && new Date(o.createdAt) < new Date(orderDateFrom)) return false;
    if (orderDateTo && new Date(o.createdAt) > new Date(orderDateTo + "T23:59:59")) return false;
    return o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${o.renter.firstName} ${o.renter.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
      <div className="text-gray-500">Loading admin panel...</div>
    </div>
  );

  return (
    <>
    <div className="min-h-screen bg-[#F4F6FB] pb-24">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-[#0B215E] to-[#1a3a8f] px-4 pt-10 pb-6 shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-blue-200 text-xs mb-1 uppercase tracking-wider font-semibold">Admin Panel</p>
            <h1 className="text-2xl font-bold text-white">EQUIPSHARE</h1>
          </div>
          <button onClick={handleLogout} className="bg-white/10 text-white text-xs px-3 py-1.5 rounded-full hover:bg-white/20 transition-colors">
            Logout
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 mt-6">
          <div className="bg-white/10 rounded-xl p-3 text-white text-center border border-white/5">
            <p className="text-2xl font-bold">{users.length}</p>
            <p className="text-blue-200 text-[10px] mt-0.5">Total Users</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-white text-center border border-white/5">
            <p className="text-2xl font-bold">{equipments.length}</p>
            <p className="text-blue-200 text-[10px] mt-0.5">Equipment</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-white text-center border border-white/5">
            <p className="text-2xl font-bold">{orders.length}</p>
            <p className="text-blue-200 text-[10px] mt-0.5">Orders</p>
          </div>
        </div>

        {/* Sales stats */}
        <div className="grid grid-cols-3 gap-2.5 mt-2.5">
          <div className="bg-white/10 rounded-xl p-3 text-white text-center border border-white/5">
            <p className="text-lg font-bold text-green-300">Rwf {dailySales.toFixed(0)}</p>
            <p className="text-blue-200 text-[9px] mt-0.5">Daily</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-white text-center border border-white/5">
            <p className="text-lg font-bold text-green-300">Rwf {weeklySales.toFixed(0)}</p>
            <p className="text-blue-200 text-[9px] mt-0.5">Weekly</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-white text-center border border-white/5">
            <p className="text-lg font-bold text-green-300">Rwf {monthlySales.toFixed(0)}</p>
            <p className="text-blue-200 text-[9px] mt-0.5">Monthly</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* Search Field */}
        <div className="mb-4">
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#0B215E] shadow-sm"
          />
        </div>

        {/* Tab Bar */}
        <div className="flex bg-white rounded-xl shadow-sm overflow-hidden mb-4 border border-gray-100">
          {(["users", "equipment", "orders", "sales"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSearchQuery(""); }}
              className={`flex-1 py-3 text-xs font-semibold capitalize transition-colors ${activeTab === tab ? "bg-[#0B215E] text-white" : "text-gray-500 hover:bg-gray-50"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* USERS TAB */}
        {activeTab === "users" && (
          <div className="space-y-3">
            {/* Action Bar */}
            <div className="flex gap-2 mb-2">
              <button
                onClick={handleOpenAdd}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#0B215E] text-white text-xs font-bold py-2.5 rounded-xl hover:bg-blue-900 transition-colors shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add User
              </button>
              <button
                onClick={handleExportPDF}
                className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold py-2.5 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                Export PDF
              </button>
            </div>
            {filteredUsers.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">No users found.</p>}
            {filteredUsers.map((u) => (
              <div key={u.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-bold text-gray-900 text-sm">{u.firstName} {u.lastName}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getRoleBadge(u.role)}`}>
                        {u.role}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{u.email}</p>
                    {u.phone && <p className="text-xs text-gray-400 mt-0.5">{u.phone}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      Joined {new Date(u.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${u.isVerified ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"}`}>
                    {u.isVerified ? "Verified" : "Unverified"}
                  </span>
                </div>

                {/* Moderation Controls */}
                <div className="pt-3 border-t border-gray-50 space-y-2">
                  <div className="flex justify-between items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleToggleVerify(u.id)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                        u.isVerified 
                          ? "border-yellow-200 text-yellow-700 bg-yellow-50 hover:bg-yellow-100" 
                          : "border-green-200 text-green-700 bg-green-50 hover:bg-green-100"
                      }`}
                    >
                      {u.isVerified ? "Unverify User" : "Verify User"}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Role:</label>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-800 bg-white font-semibold focus:outline-none"
                      >
                        <option value="RENTER">Renter</option>
                        <option value="OWNER">Owner</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                  </div>

                  {/* Edit / Delete */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-1.5 rounded-lg border border-[#0B215E]/30 text-[#0B215E] bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-1.5 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EQUIPMENT TAB */}
        {activeTab === "equipment" && (
          <div className="space-y-3">
            <button onClick={handleExportEquipPDF} className="w-full flex items-center justify-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold py-2.5 rounded-xl hover:bg-gray-50 transition-colors shadow-sm mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
              Export Equipment PDF
            </button>
            {filteredEquip.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">No equipment found.</p>}
            {filteredEquip.map((eq) => (
              <div key={eq.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
                <div className="flex gap-3">
                  {eq.images?.[0] && (
                    <img src={eq.images[0]} alt={eq.title} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-gray-900 text-sm truncate">{eq.title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${eq.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {eq.isActive ? "Approved" : "Suspended"}
                      </span>
                    </div>
                    <p className="text-xs text-[#0B215E] font-semibold">{eq.category}</p>
                    <p className="text-xs text-gray-500 mt-1">Owner: {eq.owner.firstName} {eq.owner.lastName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{eq.location}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-[#FF5C00]">Rwf {eq.hourlyRate}<span className="text-[10px] font-normal text-gray-400">/hr</span></p>
                    {eq.dailyRate ? <p className="text-xs font-semibold text-gray-500">Rwf {eq.dailyRate}<span className="text-[9px] font-normal">/day</span></p> : null}
                    {eq.maxRentalPeriod && <p className="text-[10px] text-[#FF5C00] font-semibold mt-0.5">Max: {eq.maxRentalPeriod}</p>}
                  </div>
                </div>

                {/* Listing Action */}
                <div className="pt-2 border-t border-gray-50 flex justify-end">
                  <button
                    onClick={() => handleToggleEquip(eq.id)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                      eq.isActive 
                        ? "border-red-200 text-red-700 bg-red-50 hover:bg-red-100" 
                        : "border-green-200 text-green-700 bg-green-50 hover:bg-green-100"
                    }`}
                  >
                    {eq.isActive ? "Suspend Listing" : "Approve Listing"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 mb-1 block">Status</label>
                  <select value={orderStatusFilter} onChange={e => setOrderStatusFilter(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs text-gray-900 bg-white focus:outline-none">
                    <option value="">All statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELED">Canceled</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 mb-1 block">From</label>
                  <input type="date" value={orderDateFrom} onChange={e => setOrderDateFrom(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs text-gray-900 bg-white focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 mb-1 block">To</label>
                  <input type="date" value={orderDateTo} onChange={e => setOrderDateTo(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs text-gray-900 bg-white focus:outline-none" />
                </div>
                <div className="flex items-end">
                  <button onClick={handleExportOrdersPDF} className="w-full flex items-center justify-center gap-1.5 bg-[#0B215E] text-white text-xs font-bold py-2.5 rounded-lg hover:bg-blue-900 transition-colors shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                    Export PDF
                  </button>
                </div>
              </div>
            </div>
            {filteredOrders.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">No orders found.</p>}
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">#{order.orderNumber.slice(-8).toUpperCase()}</h3>
                    <p className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${getStatusColor(order.status)}`}>
                    {order.status.toLowerCase()}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Renter</p>
                  <p className="text-sm font-bold text-gray-900">{order.renter.firstName} {order.renter.lastName}</p>
                  <p className="text-xs text-gray-500">{order.renter.email}</p>
                </div>

                <div className="space-y-1.5 mb-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-700">{item.equipment.title} × {item.quantity || 1}</span>
                      <span className="font-bold text-[#FF5C00]">Rwf {item.totalAmount.toFixed(0)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <span className="text-sm font-bold text-gray-900">Total</span>
                  <span className="text-base font-bold text-[#0B215E]">Rwf {order.totalAmount.toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SALES TAB */}
        {activeTab === "sales" && (
          <div className="space-y-4">
            {/* Preset & Export buttons */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setSalesPreset("daily")} className={`py-2.5 rounded-lg text-xs font-bold transition-colors shadow-sm ${salesPeriodLabel === "Daily" ? "bg-[#0B215E] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                  Daily
                </button>
                <button onClick={() => setSalesPreset("weekly")} className={`py-2.5 rounded-lg text-xs font-bold transition-colors shadow-sm ${salesPeriodLabel === "Weekly" ? "bg-[#0B215E] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                  Weekly
                </button>
                <button onClick={() => setSalesPreset("monthly")} className={`py-2.5 rounded-lg text-xs font-bold transition-colors shadow-sm ${salesPeriodLabel === "Monthly" ? "bg-[#0B215E] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                  Monthly
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 mb-1 block">From</label>
                  <input type="date" value={salesDateFrom} onChange={e => { setSalesDateFrom(e.target.value); setSalesPeriodLabel(""); }} className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs text-gray-900 bg-white focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 mb-1 block">To</label>
                  <input type="date" value={salesDateTo} onChange={e => { setSalesDateTo(e.target.value); setSalesPeriodLabel(""); }} className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs text-gray-900 bg-white focus:outline-none" />
                </div>
                <div className="flex items-end">
                  <button onClick={handleExportSalesPDF} className="w-full flex items-center justify-center gap-1.5 bg-[#0B215E] text-white text-xs font-bold py-2.5 rounded-lg hover:bg-blue-900 transition-colors shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                    Export PDF
                  </button>
                </div>
              </div>
            </div>
            {filteredSales.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">No sales data found.</p>}
            {filteredSales.map((s) => (
              <div key={s.date} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-gray-900 text-sm">{s.date}</h3>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-50 text-green-700">
                    {s.orders.length} order{s.orders.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-1.5 mb-3">
                  {s.orders.map((o) => (
                    <div key={o.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">#{o.orderNumber.slice(-8).toUpperCase()} — {o.items.map(i => i.equipment.title).join(", ")}</span>
                      <span className="font-bold text-[#FF5C00]">Rwf {o.totalAmount.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <span className="text-sm font-bold text-gray-900">Daily Total</span>
                  <span className="text-base font-bold text-[#0B215E]">Rwf {s.total.toFixed(0)}</span>
                </div>
              </div>
            ))}
            {filteredSales.length > 0 && (
              <div className="bg-gradient-to-r from-[#0B215E] to-[#1a3a8f] rounded-xl p-4 shadow-md">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-white">Grand Total</span>
                  <span className="text-xl font-bold text-green-300">Rwf {filteredSales.reduce((s, g) => s + g.total, 0).toFixed(0)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>

      {/* â”€â”€ Add / Edit User Modal â”€â”€ */}
      {showUserModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) setShowUserModal(false); }}
        >
          <div className="bg-white w-full max-w-lg rounded-t-3xl px-6 pt-6 pb-10 max-h-[90dvh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingUser ? "Edit User" : "Add New User"}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {editingUser ? `Editing ${editingUser.firstName} ${editingUser.lastName}` : "Create a new platform account"}
                </p>
              </div>
              <button
                onClick={() => setShowUserModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors font-bold text-sm"
              >
                âœ•
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5">
              {/* Name Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={userForm.firstName}
                    onChange={(e) => setUserForm((p) => ({ ...p, firstName: e.target.value }))}
                    placeholder="John"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#0B215E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={userForm.lastName}
                    onChange={(e) => setUserForm((p) => ({ ...p, lastName: e.target.value }))}
                    placeholder="Doe"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#0B215E]"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="john@example.com"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#0B215E]"
                />
              </div>

              {/* Password (only for new users) */}
              {!editingUser && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Password <span className="text-gray-400 font-normal">(default: 123456)</span>
                  </label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))}
                    placeholder="Leave blank for default"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#0B215E]"
                  />
                </div>
              )}

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={userForm.phone}
                  onChange={(e) => setUserForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+1 555 000 0000"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#0B215E]"
                />
              </div>

              {/* Role & Verified Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Account Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm((p) => ({ ...p, role: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#0B215E] bg-white"
                  >
                    <option value="RENTER">Renter</option>
                    <option value="OWNER">Owner</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <div
                      onClick={() => setUserForm((p) => ({ ...p, isVerified: !p.isVerified }))}
                      className={`w-11 h-6 rounded-full transition-colors relative ${
                        userForm.isVerified ? "bg-green-500" : "bg-gray-200"
                      }`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        userForm.isVerified ? "translate-x-5" : "translate-x-0.5"
                      }`} />
                    </div>
                    <span className="text-xs font-bold text-gray-600">
                      {userForm.isVerified ? "Verified" : "Unverified"}
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full mt-2 bg-gradient-to-r from-[#0B215E] to-[#1a3a8f] text-white py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shadow-md"
              >
                {editingUser ? "Save Changes" : "Create User"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}




