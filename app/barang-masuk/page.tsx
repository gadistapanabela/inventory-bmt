"use client";

import { useState, useEffect } from "react";
import { Search, Trash2, Download, Plus, X, PackagePlus } from "lucide-react";
import { supabase } from "../../lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useRouter } from "next/navigation";

export default function BarangMasukPage() {
  const router = useRouter();
  const [barangMasuk, setBarangMasuk] = useState<any[]>([]);
  
  // State untuk Dropdown Form
  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // State Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    kd_sup: "",
    kd_prod: "",
    qty: "",
  });

  const fetchData = async () => {
    const { data: bm } = await supabase
      .from("barang_masuk")
      .select(`*, products(nama, kd_prod), suppliers(nama, kd_sup)`)
      .order("created_at", { ascending: false });
    
    setBarangMasuk(bm || []);
  };

  const fetchDropdownData = async () => {
    const { data: supData } = await supabase
      .from("suppliers")
      .select("kd_sup, nama")
      .order("nama", { ascending: true });
      
    const { data: prodData } = await supabase
      .from("products")
      .select("kd_prod, nama")
      .order("nama", { ascending: true });
      
    setSuppliersList(supData || []);
    setProductsList(prodData || []);
  };

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

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile?.role === "petugas") {
        alert("Akses Ditolak!");
        router.push("/pos");
        return;
      }
      
      await fetchData();
      await fetchDropdownData(); 
      setIsLoading(false);
    };
    init();
  }, [router]);

  const handleOpenAdd = () => {
    setFormData({ kd_sup: "", kd_prod: "", qty: "" });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ kd_sup: "", kd_prod: "", qty: "" });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.kd_sup || !formData.kd_prod) {
      alert("Pemasok dan Produk wajib dipilih!");
      return;
    }
    
    setIsSaving(true);
    try {
      const payload = {
        kd_sup: formData.kd_sup,
        kd_prod: formData.kd_prod,
        qty: Number(formData.qty),
        tgl: new Date().toISOString().split("T")[0],
      };

      const { error } = await supabase
        .from("barang_masuk")
        .insert([payload]);

      if (error) throw error;

      closeModal();
      await fetchData();
    } catch (err: any) {
      alert("Gagal memproses transaksi: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus data barang masuk ini? Stok tidak akan dikembalikan otomatis.")) return;
    const { error } = await supabase.from("barang_masuk").delete().eq("id", id);
    if (error) alert("Gagal hapus: " + error.message);
    else await fetchData();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Laporan Data Barang Masuk", 14, 20);
    doc.text("BMT SMK Assyafi'iyah", 14, 26);
    doc.setFontSize(10);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString("id-ID")}`, 14, 34);

    autoTable(doc, {
      head: [["No. Trans", "Tanggal", "Produk", "Supplier", "Qty"]],
      body: barangMasuk.map((b) => [
        b.no_trans_masuk || "-",
        b.tgl ? new Date(b.tgl).toLocaleDateString("id-ID") : "-",
        `${b.products?.kd_prod || ""} - ${b.products?.nama || ""}`,
        `${b.suppliers?.kd_sup || ""} - ${b.suppliers?.nama || ""}`,
        b.qty,
      ]),
      startY: 40,
      theme: "grid",
      headStyles: { fillColor: [245, 158, 11] }, // Kuning Emas
    });
    doc.save(`BarangMasuk_${new Date().getTime()}.pdf`);
  };

  const filtered = barangMasuk.filter((b) =>
    [b.no_trans_masuk, b.products?.nama, b.suppliers?.nama, b.products?.kd_prod]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Barang Masuk</h1>
          <p className="text-xs text-gray-500 mt-1">Pencatatan riwayat penambahan stok produk dari Pemasok.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToPDF}
            title="Cetak PDF"
            aria-label="Cetak PDF"
            className="flex items-center gap-2 px-4 py-2 bg-[#141820] border border-white/8 text-gray-300 hover:text-white rounded-xl text-sm transition-all shadow-lg"
          >
            <Download size={15} /> Cetak PDF
          </button>
          <button
            onClick={handleOpenAdd}
            title="Catat Barang Masuk"
            aria-label="Catat Barang Masuk"
            className="flex items-center gap-2 px-4 py-2 bg-[#f59e0b] hover:bg-[#d97706] text-white rounded-xl text-sm font-semibold transition-all shadow-lg"
          >
            <Plus size={15} /> Tambah Transaksi
          </button>
        </div>
      </div>

      {/* Tabel Data */}
      <div className="bg-[#141820] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex justify-end">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            <input
              type="text"
              placeholder="Cari transaksi..."
              title="Cari Transaksi"
              aria-label="Cari Transaksi"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#0f1117] border border-white/8 text-white text-sm pl-9 pr-4 py-2 rounded-lg focus:outline-none w-56 placeholder:text-gray-600 focus:border-[#f59e0b]/50 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3 text-left font-medium">No. Trans</th>
                <th className="px-5 py-3 text-left font-medium">Tanggal</th>
                <th className="px-5 py-3 text-left font-medium">Produk</th>
                <th className="px-5 py-3 text-left font-medium">Supplier</th>
                <th className="px-5 py-3 text-left font-medium">Qty</th>
                <th className="px-5 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-500 animate-pulse">Memuat data...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-500">Data tidak ditemukan.</td></tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-5 py-4"><span className="bg-[#f59e0b]/10 text-[#f59e0b] text-xs font-mono font-semibold px-2.5 py-1 rounded-lg">{b.no_trans_masuk}</span></td>
                    <td className="px-5 py-4 text-gray-400 text-xs">
                      {b.tgl ? new Date(b.tgl).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-white font-medium text-xs">{b.products?.nama || "-"}</span>
                        <span className="text-gray-500 text-xs font-mono">{b.products?.kd_prod}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-gray-300 text-xs">{b.suppliers?.nama || "-"}</span>
                        <span className="text-gray-500 text-xs font-mono">{b.suppliers?.kd_sup}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4"><span className="bg-green-400/10 text-green-400 text-xs font-semibold px-2.5 py-1 rounded-lg">+{b.qty}</span></td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <button onClick={() => handleDelete(b.id)} title="Hapus Data" aria-label="Hapus Data" className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                          <Trash2 size={14} />
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

      {/* Modal Tambah Transaksi */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141820] border border-white/8 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#f59e0b]/10 rounded-lg flex items-center justify-center">
                  <PackagePlus size={16} className="text-[#f59e0b]" />
                </div>
                <h2 className="text-base font-semibold text-white">
                  Catat Barang Masuk
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                title="Tutup Modal"
                aria-label="Tutup Modal"
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Pemasok (Supplier) <span className="text-red-400">*</span>
                </label>
                <select
                  required
                  title="Pilih Pemasok"
                  aria-label="Pilih Pemasok"
                  value={formData.kd_sup}
                  onChange={(e) => setFormData({ ...formData, kd_sup: e.target.value })}
                  className="bg-[#0f1117] border border-white/8 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#f59e0b]/50 transition-all"
                >
                  <option value="" disabled>-- Pilih Pemasok --</option>
                  {suppliersList.map((sup) => (
                    <option key={sup.kd_sup} value={sup.kd_sup}>
                      {sup.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Produk <span className="text-red-400">*</span>
                </label>
                <select
                  required
                  title="Pilih Produk"
                  aria-label="Pilih Produk"
                  value={formData.kd_prod}
                  onChange={(e) => setFormData({ ...formData, kd_prod: e.target.value })}
                  className="bg-[#0f1117] border border-white/8 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#f59e0b]/50 transition-all"
                >
                  <option value="" disabled>-- Pilih Produk --</option>
                  {productsList.map((prod) => (
                    <option key={prod.kd_prod} value={prod.kd_prod}>
                      {prod.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Jumlah (Qty) Masuk <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  title="Jumlah Qty"
                  aria-label="Jumlah Qty"
                  value={formData.qty}
                  onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                  placeholder="Masukkan jumlah stok..."
                  className="bg-[#0f1117] border border-white/8 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#f59e0b]/50 transition-all placeholder:text-gray-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/5 mt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  title="Batal"
                  aria-label="Batal"
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  title="Simpan Transaksi"
                  aria-label="Simpan Transaksi"
                  className="px-6 py-2 text-sm font-semibold bg-[#f59e0b] hover:bg-[#d97706] disabled:opacity-50 text-white rounded-xl transition-all shadow-lg shadow-[#f59e0b]/20"
                >
                  {isSaving ? "Menyimpan..." : "Simpan Transaksi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}