"use client";

import { useState, useEffect } from "react";
import { Download, Plus, Search, Edit, X, Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useRouter } from "next/navigation";

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nama: "",
    alamat: "",
    no_telp: "",
    kategori: "ATK",
  });

  const fetchSuppliers = async () => {
    const { data } = await supabase
      .from("suppliers")
      .select("*")
      .order("created_at", { ascending: false });
    setSuppliers(data || []);
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
      await fetchSuppliers();
      setIsLoading(false);
    };
    init();
  }, [router]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      nama: "",
      alamat: "",
      no_telp: "",
      kategori: "ATK",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ nama: "", alamat: "", no_telp: "", kategori: "ATK" });
  };

  const openEditModal = (s: any) => {
    setEditingId(s.id);
    setFormData({
      nama: s.nama || "",
      alamat: s.alamat || "",
      no_telp: s.no_telp || "",
      kategori: s.kategori || "ATK",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      nama: formData.nama,
      alamat: formData.alamat,
      no_telp: formData.no_telp,
      kategori: formData.kategori,
    };

    try {
      if (editingId) {
        // Mode Edit: Hanya update identitas supplier
        const { error: errUpdate } = await supabase
          .from("suppliers")
          .update(payload)
          .eq("id", editingId);
        if (errUpdate) throw errUpdate;
      } else {
        // Mode Tambah: Hanya insert identitas supplier baru
        const { error: supError } = await supabase
          .from("suppliers")
          .insert([payload]);
        if (supError) throw supError;
      }

      closeModal();
      await fetchSuppliers();
    } catch (err: any) {
      alert("Gagal menyimpan data: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus pemasok ini?")) return;
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) alert("Gagal hapus: " + error.message);
    else await fetchSuppliers();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Laporan Data Pemasok", 14, 20);
    doc.text("BMT SMK Assyafi'iyah", 14, 26);
    doc.setFontSize(10);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString("id-ID")}`, 14, 34);

    autoTable(doc, {
      head: [["Kd. Pemasok", "Nama Pemasok", "Alamat", "No. Telp", "Kategori"]],
      body: suppliers.map((s) => [
        s.kd_sup || "-",
        s.nama || "-",
        s.alamat || "-",
        s.no_telp || "-",
        s.kategori || "-",
      ]),
      startY: 40,
      theme: "grid",
      headStyles: { fillColor: [245, 158, 11] },
      styles: { fontSize: 9 },
    });
    doc.save(`Pemasok_${new Date().getTime()}.pdf`);
  };

  const filtered = suppliers.filter((s) =>
    [s.kd_sup, s.nama, s.no_telp, s.alamat, s.kategori]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Pemasok / Supplier</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToPDF}
            title="Export PDF"
            aria-label="Export PDF"
            className="flex items-center gap-2 px-4 py-2 bg-[#141820] border border-white/8 text-gray-300 hover:text-white rounded-xl text-sm transition-all"
          >
            <Download size={15} /> Export PDF
          </button>
          <button
            onClick={handleOpenAdd}
            title="Tambah Pemasok"
            aria-label="Tambah Pemasok"
            className="flex items-center gap-2 px-4 py-2 bg-[#f59e0b] hover:bg-[#d97706] text-white rounded-xl text-sm font-semibold transition-all"
          >
            <Plus size={15} /> Tambah
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
              placeholder="Cari pemasok, alamat, kategori..."
              title="Cari Pemasok"
              aria-label="Cari Pemasok"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#0f1117] border border-white/8 text-white text-sm pl-9 pr-4 py-2 rounded-lg w-72 focus:outline-none focus:border-[#f59e0b]/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3 text-left font-medium">Kd. Pemasok</th>
                <th className="px-5 py-3 text-left font-medium">Nama Pemasok</th>
                <th className="px-5 py-3 text-left font-medium">Alamat</th>
                <th className="px-5 py-3 text-left font-medium">No. Telp</th>
                <th className="px-5 py-3 text-left font-medium">Kategori</th>
                <th className="px-5 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-500 animate-pulse">Memuat data...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-500">Data tidak ditemukan.</td></tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-5 py-4"><span className="bg-[#f59e0b]/10 text-[#f59e0b] text-xs font-mono font-semibold px-2.5 py-1 rounded-lg">{s.kd_sup}</span></td>
                    <td className="px-5 py-4 text-white font-medium">{s.nama}</td>
                    <td className="px-5 py-4 text-gray-400 max-w-[200px] truncate">{s.alamat || "-"}</td>
                    <td className="px-5 py-4 text-gray-400">{s.no_telp || "-"}</td>
                    <td className="px-5 py-4 text-gray-400">{s.kategori || "-"}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button type="button" onClick={() => openEditModal(s)} title="Ubah Data" aria-label="Ubah Data" className="p-1.5 text-gray-500 hover:text-[#f59e0b] hover:bg-[#f59e0b]/10 rounded-lg"><Edit size={14} /></button>
                        <button type="button" onClick={() => handleDelete(s.id)} title="Hapus Data" aria-label="Hapus Data" className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141820] border border-white/8 rounded-2xl w-full max-w-xl shadow-2xl">
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/5">
              <h2 className="text-base font-semibold text-white">
                {editingId ? "Edit Pemasok" : "Tambah Pemasok Baru"}
              </h2>
              <button type="button" onClick={closeModal} title="Tutup Formulir" aria-label="Tutup Formulir" className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>

            <form onSubmit={handleSave} autoComplete="off" className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-400 uppercase">Nama Pemasok <span className="text-red-400">*</span></label>
                  <input 
                    type="text" 
                    required 
                    title="Nama Pemasok" 
                    aria-label="Nama Pemasok" 
                    value={formData.nama} 
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })} 
                    placeholder="Nama supplier..." 
                    className="bg-[#0f1117] border border-white/8 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#f59e0b]/50" 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-400 uppercase">No. Telp</label>
                  <input type="text" title="No Telepon" aria-label="No Telepon" value={formData.no_telp} onChange={(e) => setFormData({ ...formData, no_telp: e.target.value })} placeholder="Masukkan nomor telepon..." className="bg-[#0f1117] border border-white/8 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#f59e0b]/50" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase">Kategori <span className="text-red-400">*</span></label>
                <select
                  title="Pilih Kategori"
                  aria-label="Pilih Kategori"
                  value={formData.kategori}
                  onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                  className="bg-[#0f1117] border border-white/8 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#f59e0b]/50"
                >
                  <option value="ATK">ATK</option>
                  <option value="Makanan">Makanan</option>
                  <option value="Minuman">Minuman</option>
                  <option value="P3K">P3K</option>
                  <option value="Seragam">Seragam</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase">Alamat</label>
                <input
                  type="text"
                  title="Alamat Pemasok"
                  aria-label="Alamat Pemasok"
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  placeholder="Masukkan alamat lengkap supplier..."
                  className="bg-[#0f1117] border border-white/8 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#f59e0b]/50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/5 mt-2">
                <button type="button" onClick={closeModal} title="Batal" aria-label="Batal" className="px-4 py-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl">Batal</button>
                <button type="submit" disabled={isSaving} title="Simpan Data" aria-label="Simpan Data" className="px-6 py-2 text-sm font-semibold bg-[#f59e0b] hover:bg-[#d97706] disabled:opacity-50 text-white rounded-xl">
                  {isSaving ? "Memproses..." : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}