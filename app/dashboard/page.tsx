"use client";

import { useState, useEffect } from "react";
import { Download, Calendar } from "lucide-react";
import { supabase } from "../../lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import StatCard from "../Components/StatCard"; // Pastikan path ini benar

export default function Dashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ today: 0, month: 0, total: 0 });
  const [filterDate, setFilterDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [filterMonth, setFilterMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from("orders").select("*");
      if (!data) return;
      setOrders(data);

      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const monthStr = now.toISOString().slice(0, 7);

      const todayIncome = data
        .filter((o) => o.created_at?.startsWith(todayStr))
        .reduce((sum, o) => sum + Number(o.total_price), 0);
      const monthIncome = data
        .filter((o) => o.created_at?.startsWith(monthStr))
        .reduce((sum, o) => sum + Number(o.total_price), 0);
      const totalIncome = data.reduce(
        (sum, o) => sum + Number(o.total_price),
        0,
      );

      setStats({ today: todayIncome, month: monthIncome, total: totalIncome });
    }
    fetchData();
  }, []);

  const exportPDF = (type: "day" | "month") => {
    const doc = new jsPDF();
    const isDay = type === "day";
    const title = isDay
      ? `Laporan Harian: ${filterDate}`
      : `Laporan Bulanan: ${filterMonth}`;
    const filtered = orders.filter((o) =>
      o.created_at?.startsWith(isDay ? filterDate : filterMonth),
    );
    const total = filtered.reduce((sum, o) => sum + Number(o.total_price), 0);

    doc.text(title, 14, 20);
    autoTable(doc, {
      head: [["ID Order", "Tanggal", "Total Harga"]],
      body: filtered.map((o) => [
        o.id,
        o.created_at.slice(0, 10),
        `Rp ${Number(o.total_price).toLocaleString("id-ID")}`,
      ]),
      startY: 30,
    });
    doc.text(
      `Total Pendapatan: Rp ${total.toLocaleString("id-ID")}`,
      14,
      (doc as any).lastAutoTable.finalY + 10,
    );
    doc.save(`${title}.pdf`);
  };

  return (
    <div className="p-8 bg-[#0f1117] text-gray-200 min-h-screen">
      <h1 className="text-4xl font-extrabold text-white mb-8">
        Dashboard Utama
      </h1>

      {/* Ringkasan Angka */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Pendapatan Hari Ini"
          value={`Rp ${stats.today.toLocaleString("id-ID")}`}
          subtitle="Omset hari ini"
          data={[{ value: stats.today }]}
        />
        <StatCard
          title="Pendapatan Bulan Ini"
          value={`Rp ${stats.month.toLocaleString("id-ID")}`}
          subtitle="Omset bulan ini"
          data={[{ value: stats.month }]}
        />
        <StatCard
          title="Total Pendapatan"
          value={`Rp ${stats.total.toLocaleString("id-ID")}`}
          subtitle="Seluruh pendapatan"
          data={[{ value: stats.total }]}
        />
      </div>

      {/* Filter & Export */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#141820] p-6 rounded-2xl border border-white/5">
          <h2 className="mb-4 font-semibold flex items-center gap-2">
            <Calendar size={18} /> Export Laporan Harian
          </h2>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full bg-[#0f1117] p-2 rounded mb-4 border border-white/10"
          />
          <button
            onClick={() => exportPDF("day")}
            className="w-full bg-[#f59e0b] text-black py-2 rounded font-bold flex items-center justify-center gap-2"
          >
            <Download size={16} /> Download PDF
          </button>
        </div>
        <div className="bg-[#141820] p-6 rounded-2xl border border-white/5">
          <h2 className="mb-4 font-semibold flex items-center gap-2">
            <Calendar size={18} /> Export Laporan Bulanan
          </h2>
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-full bg-[#0f1117] p-2 rounded mb-4 border border-white/10"
          />
          <button
            onClick={() => exportPDF("month")}
            className="w-full bg-[#f59e0b] text-black py-2 rounded font-bold flex items-center justify-center gap-2"
          >
            <Download size={16} /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
