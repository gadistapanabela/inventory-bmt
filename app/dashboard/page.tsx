"use client";

import { useState, useEffect } from "react";
import { Download, Calendar, Package } from "lucide-react";
import { supabase } from "../../lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Dashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [filterMonth, setFilterMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from("orders").select("*");
      setOrders(data || []);
    }
    fetchData();
  }, []);

  const exportPDF = (type: "day" | "month") => {
    const doc = new jsPDF();
    const isDay = type === "day";
    const title = isDay
      ? `Laporan Harian: ${filterDate}`
      : `Laporan Bulanan: ${filterMonth}`;

    const filteredData = orders.filter((o) => {
      if (!o.created_at) return false;
      return isDay
        ? o.created_at.startsWith(filterDate)
        : o.created_at.startsWith(filterMonth);
    });

    const total = filteredData.reduce(
      (sum, o) => sum + Number(o.total_price),
      0,
    );

    doc.text(title, 14, 20);
    autoTable(doc, {
      head: [["ID Order", "Tanggal", "Total Harga"]],
      body: filteredData.map((o) => [
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
    <div className="p-8 bg-[#0f1117] text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Laporan Pendapatan</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Filter Harian */}
        <div className="bg-[#141820] p-6 rounded-2xl border border-white/5">
          <h2 className="mb-4 font-semibold flex items-center gap-2">
            <Calendar size={18} /> Laporan Harian
          </h2>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full bg-[#0f1117] p-2 rounded mb-4 border border-white/10"
          />
          <button
            onClick={() => exportPDF("day")}
            className="w-full bg-[#f59e0b] py-2 rounded font-bold flex items-center justify-center gap-2"
          >
            <Download size={16} /> Export PDF Harian
          </button>
        </div>

        {/* Filter Bulanan */}
        <div className="bg-[#141820] p-6 rounded-2xl border border-white/5">
          <h2 className="mb-4 font-semibold flex items-center gap-2">
            <Calendar size={18} /> Laporan Bulanan
          </h2>
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-full bg-[#0f1117] p-2 rounded mb-4 border border-white/10"
          />
          <button
            onClick={() => exportPDF("month")}
            className="w-full bg-[#f59e0b] py-2 rounded font-bold flex items-center justify-center gap-2"
          >
            <Download size={16} /> Export PDF Bulanan
          </button>
        </div>
      </div>
    </div>
  );
}
