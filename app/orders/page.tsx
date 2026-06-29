"use client";

import React, { useState, useEffect } from "react";
import { Download, Search, Eye, X, Receipt, ShoppingBag } from "lucide-react";
import { supabase } from "../../lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useRouter } from "next/navigation";

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // State untuk Pop-up Modal Detail
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

      const { data } = await supabase
        .from("orders")
        .select(
          `
          *,
          customers(kd_plgn, nama),
          order_items(
            qty,
            harga_satuan,
            subtotal,
            products(kd_prod, nama)
          )
        `,
        )
        .order("created_at", { ascending: false });
      setOrders(data || []);
      setIsLoading(false);
    };
    init();
  }, [router]);

  const openDetailModal = (order: any) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeDetailModal = () => {
    setSelectedOrder(null);
    setIsModalOpen(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Laporan Data Barang Keluar", 14, 20);
    doc.text("BMT SMK Assyafi'iyah", 14, 26);
    doc.setFontSize(10);
    doc.text(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`, 14, 34);

    const tableData: any[] = [];

    filtered.forEach((o) => {
      const namaPelanggan = o.customers?.nama || "Umum";
      const tglKeluar = o.tgl
        ? new Date(o.tgl).toLocaleDateString("id-ID")
        : new Date(o.created_at).toLocaleDateString("id-ID");

      if (o.order_items && o.order_items.length > 0) {
        o.order_items.forEach((item: any) => {
          tableData.push([
            o.kd_trans_klr || "-",
            namaPelanggan,
            item.products?.nama || "-",
            item.qty || 0,
            `Rp ${Number(item.subtotal).toLocaleString("id-ID")}`,
            tglKeluar,
          ]);
        });
      } else {
        tableData.push([
          o.kd_trans_klr || "-",
          namaPelanggan, 
          "-",
          0,
          `Rp ${Number(o.total_price).toLocaleString("id-ID")}`,
          tglKeluar,
        ]);
      }
    });

    autoTable(doc, {
      head: [
        [
          "Kode Transaksi",
          "Pelanggan",
          "Nama Barang",
          "Jumlah",
          "Total",
          "Tanggal Keluar",
        ],
      ],
      body: tableData,
      startY: 40,
      theme: "grid",
      headStyles: { fillColor: [245, 158, 11] },
      styles: { fontSize: 9, cellPadding: 3 },
    });

    doc.save(`Laporan_Barang_Keluar_${new Date().getTime()}.pdf`);
  };

  const filtered = orders.filter((o) =>
    [o.kd_trans_klr, o.customers?.nama]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const totalPendapatan = orders.reduce(
    (sum, o) => sum + Number(o.total_price),
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Barang Keluar (Penjualan)</h1>
          <p className="text-xs text-gray-500 mt-1">Riwayat transaksi kasir dan detail barang yang terjual.</p>
        </div>
        <button
          onClick={exportToPDF}
          title="Export ke PDF"
          aria-label="Export PDF"
          className="flex items-center gap-2 px-4 py-2 bg-[#141820] border border-white/8 text-gray-300 hover:text-white hover:border-white/20 rounded-xl text-sm transition-all shadow-lg"
        >
          <Download size={15} /> Cetak PDF Laporan
        </button>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-[#141820] border border-white/5 rounded-xl px-5 py-4">
          <p className="text-xs text-gray-500 mb-1">Total Transaksi</p>
          <p className="text-xl font-bold text-white">{orders.length}</p>
        </div>
        <div className="bg-[#141820] border border-white/5 rounded-xl px-5 py-4">
          <p className="text-xs text-gray-500 mb-1">Total Pendapatan</p>
          <p className="text-xl font-bold text-[#f59e0b]">
            Rp {totalPendapatan.toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-[#141820] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex justify-end">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            <input
              type="text"
              title="Cari transaksi"
              aria-label="Cari transaksi"
              placeholder="Cari no struk atau pelanggan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#0f1117] border border-white/8 text-white text-sm pl-9 pr-4 py-2 rounded-lg focus:outline-none focus:border-[#f59e0b]/50 w-64 transition-all placeholder:text-gray-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3 text-left font-medium">Kd. Transaksi</th>
                <th className="px-5 py-3 text-left font-medium">Tanggal</th>
                <th className="px-5 py-3 text-left font-medium">Pelanggan</th>
                <th className="px-5 py-3 text-left font-medium">Total Harga</th>
                <th className="px-5 py-3 text-center font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-500 text-sm animate-pulse">
                    Memuat riwayat transaksi...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-500 text-sm">
                    {search ? "Transaksi tidak ditemukan." : "Belum ada transaksi."}
                  </td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-5 py-4">
                      <span className="bg-[#f59e0b]/10 text-[#f59e0b] text-xs font-mono font-semibold px-2.5 py-1 rounded-lg">
                        {o.kd_trans_klr}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs">
                      {o.tgl
                        ? new Date(o.tgl).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                        : new Date(o.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-5 py-4 text-white text-sm font-medium">
                      {o.customers?.nama || "Umum"}
                    </td>
                    <td className="px-5 py-4 text-[#f59e0b] font-bold">
                      Rp {Number(o.total_price).toLocaleString("id-ID")}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-center">
                        <button 
                          onClick={() => openDetailModal(o)} 
                          title="Lihat Detail Transaksi" 
                          aria-label="Lihat Detail" 
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f59e0b]/10 text-[#f59e0b] hover:bg-[#f59e0b] hover:text-white rounded-lg transition-all text-xs font-semibold"
                        >
                          <Eye size={14} /> Detail
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POP-UP MODAL DETAIL TRANSAKSI */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141820] border border-white/8 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header Modal */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#f59e0b]/10 rounded-lg flex items-center justify-center">
                  <Receipt size={16} className="text-[#f59e0b]" />
                </div>
                <h2 className="text-base font-bold text-white">Detail Transaksi</h2>
              </div>
              <button onClick={closeDetailModal} title="Tutup Modal" aria-label="Tutup Modal" className="text-gray-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Konten Modal (Bisa di-scroll kalau barangnya banyak) */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {/* Info Pelanggan & Struk */}
              <div className="flex justify-between items-start mb-6 bg-[#0f1117] p-4 rounded-xl border border-white/5">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">No. Transaksi</p>
                  <p className="text-sm font-mono font-bold text-[#f59e0b]">{selectedOrder.kd_trans_klr}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Pelanggan</p>
                  <p className="text-sm font-semibold text-white">{selectedOrder.customers?.nama || "Umum"}</p>
                </div>
              </div>

              {/* Tabel Rincian Barang */}
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-3 flex items-center gap-2">
                  <ShoppingBag size={14} /> DAFTAR BARANG DIBELI
                </p>
                <div className="border border-white/5 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-white/[0.02]">
                      <tr className="border-b border-white/5 text-xs text-gray-500 uppercase">
                        <th className="px-4 py-3 text-left font-medium">Nama Barang</th>
                        <th className="px-4 py-3 text-right font-medium">Harga</th>
                        <th className="px-4 py-3 text-center font-medium">Qty</th>
                        <th className="px-4 py-3 text-right font-medium">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                        selectedOrder.order_items.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-white/2">
                            <td className="px-4 py-3 text-white">{item.products?.nama || "-"}</td>
                            <td className="px-4 py-3 text-gray-400 text-right">Rp {Number(item.harga_satuan).toLocaleString("id-ID")}</td>
                            <td className="px-4 py-3 text-[#f59e0b] font-bold text-center">x{item.qty}</td>
                            <td className="px-4 py-3 text-white font-semibold text-right">Rp {Number(item.subtotal).toLocaleString("id-ID")}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-gray-500 text-xs italic">
                            Detail rincian barang tidak ditemukan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer Modal (Total Belanja) */}
            <div className="p-6 border-t border-white/5 bg-white/[0.01] flex justify-between items-center">
              <span className="text-gray-400 text-sm font-medium">Total Keseluruhan</span>
              <span className="text-xl font-bold text-[#f59e0b]">Rp {Number(selectedOrder.total_price).toLocaleString("id-ID")}</span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}