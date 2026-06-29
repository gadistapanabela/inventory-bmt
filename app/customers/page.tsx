"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Edit, X, Users, Trash2, Download } from "lucide-react";
import { supabase } from "../../lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useRouter } from "next/navigation";

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // FITUR BARU: Tambahkan nis_nip ke state formData
  const [formData, setFormData] = useState({
    nama: "",
    nis_nip: "", // Kolom baru untuk NIS/NIP
    status: "aktif",
  });

  const fetchCustomers = async () => {
    const { data } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    setCustomers(data || []);
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
      await fetchCustomers();
      setIsLoading(false);
    };
    init();
  }, [router]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ nama: "", nis_nip: "", status: "aktif" });
  };

  const openEditModal = (c: any) => {
    setEditingId(c.id);
    setFormData({
      nama: c.nama || "",
      nis_nip: c.nis_nip || "", // Load data NIS/NIP saat edit
      status: c.status || "aktif",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // FITUR BARU: Masukkan nis_nip ke payload yang dikirim ke Supabase
    const payload = {
      nama: formData.nama,
      nis_nip: formData.nis_nip,
      status: formData.status,
    };

    try {
      let error;
      if (editingId) {
        const result = await supabase
          .from("customers")
          .update(payload)
          .eq("id", editingId);
        error = result.error;
      } else {
        const result = await supabase.from("customers").insert([payload]);
        error = result.error;
      }

      if (error) throw error;

      closeModal();
      await fetchCustomers();
    } catch (error) {
      const err = error as Error;
      alert("Gagal menyimpan: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Safe Delete (Cek riwayat transaksi sebelum hapus)
  const handleDelete = async (customer: any) => {
    if (!confirm(`Yakin ingin menghapus pelanggan ${customer.nama}?`)) return;

    const { count } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("kd_plgn", customer.kd_plgn);

    if (count && count > 0) {
      alert(
        `Pelanggan ${customer.nama} tidak bisa dihapus karena memiliki riwayat ${count} transaksi.\n\nJika ingin menghapus, pastikan data transaksinya sudah kosong terlebih dahulu.`,
      );
      return;
    }

    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", customer.id);

    if (error) {
      alert("Gagal hapus: " + error.message);
    } else {
      alert("Pelanggan berhasil dihapus!");
      await fetchCustomers();
    }
  };

  // FITUR BARU: Cetak PDF Laporan Pelanggan Dua Baris Vertikal Rapi
  const exportToPDF = () => {
    const doc = new jsPDF();

    // Baris 1: Judul Utama Laporan
    doc.setFontSize(14);
    doc.text("Laporan Data Pelanggan", 14, 20);

    // Baris 2: Nama Sekolah tepat di bawahnya (Posisi Y diturunkan ke 26)
    doc.text("BMT SMK Assyafi'iyah", 14, 26);

    // Sub-header Tanggal Cetak (Diturunkan ke Y = 34)
    doc.setFontSize(10);
    doc.text(
      `Tanggal Cetak: ${new Date().toLocaleDateString("id-ID")}`,
      14,
      34,
    );

    // Generate Tabel Data Pelanggan (Mulai di startY = 40 agar tidak menabrak judul)
    autoTable(doc, {
      head: [["Kd. Pelanggan", "Nama Lengkap", "NIS / NIP", "Status"]],
      body: filtered.map((c) => [
        c.kd_plgn || "-",
        c.nama || "-",
        c.nis_nip || "-",
        c.status || "-",
      ]),
      startY: 40,
      theme: "grid",
      headStyles: { fillColor: [245, 158, 11] }, // FIX: Warna Kuning Emas PDF
      styles: { fontSize: 9, cellPadding: 3 },
    });

    doc.save(`Laporan_Pelanggan_${new Date().getTime()}.pdf`);
  };

  const filtered = customers.filter((c) =>
    [c.kd_plgn, c.nama, c.nis_nip, c.status]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Pelanggan</h1>
        </div>
        <div className="flex gap-2">
          {/* TOMBOL BARU: Export PDF */}
          <button
            onClick={exportToPDF}
            title="Cetak PDF Laporan Pelanggan"
            aria-label="Cetak PDF Laporan Pelanggan"
            className="flex items-center gap-2 px-4 py-2 bg-[#141820] border border-white/8 text-gray-300 hover:text-white hover:border-white/20 rounded-xl text-sm transition-all shadow-lg"
          >
            <Download size={15} /> Cetak PDF
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            title="Tambah Pelanggan Baru"
            aria-label="Tambah Pelanggan Baru"
            className="flex items-center gap-2 px-4 py-2 bg-[#f59e0b] hover:bg-[#d97706] text-white rounded-xl text-sm font-semibold transition-all shadow-lg"
          >
            <Plus size={15} /> Tambah
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-[#141820] border border-white/5 rounded-2xl overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-white/5 flex justify-end">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              size={14}
            />
            <input
              type="text"
              title="Cari pelanggan"
              aria-label="Cari pelanggan"
              placeholder="Cari pelanggan atau NIS..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearch(e.target.value)
              }
              className="bg-[#0f1117] border border-white/8 text-white text-sm pl-9 pr-4 py-2 rounded-lg focus:outline-none focus:border-[#f59e0b]/50 w-64 transition-all placeholder:text-gray-600"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3 text-left font-medium">
                  Kd. Pelanggan
                </th>
                <th className="px-5 py-3 text-left font-medium">Nama</th>
                {/* Header Tabel Baru untuk NIS/NIP */}
                <th className="px-5 py-3 text-left font-medium">NIS / NIP</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-gray-500 animate-pulse"
                  >
                    Memuat data...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    Pelanggan tidak ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-5 py-4">
                      <span className="bg-[#f59e0b]/10 text-[#f59e0b] text-xs font-mono font-semibold px-2.5 py-1 rounded-lg">
                        {c.kd_plgn}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-white font-medium">
                      {c.nama}
                    </td>
                    {/* Data Body Baru untuk NIS/NIP */}
                    <td className="px-5 py-4 text-gray-400 font-mono text-xs">
                      {c.nis_nip || "-"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                          c.status === "aktif"
                            ? "bg-green-400/10 text-green-400"
                            : "bg-red-400/10 text-red-400"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(c)}
                          title="Ubah Data Pelanggan"
                          aria-label={`Ubah data ${c.nama || ""}`}
                          className="p-1.5 text-gray-500 hover:text-[#f59e0b] hover:bg-[#f59e0b]/10 rounded-lg transition-all"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c)}
                          title="Hapus Data Pelanggan"
                          aria-label={`Hapus data ${c.nama || ""}`}
                          className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                        >
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141820] border border-white/8 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#f59e0b]/10 rounded-lg flex items-center justify-center">
                  <Users size={16} className="text-[#f59e0b]" />
                </div>
                <h2 className="text-base font-semibold text-white">
                  {editingId ? "Edit Pelanggan" : "Tambah Pelanggan"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                title="Tutup Formulir"
                aria-label="Tutup Formulir"
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Nama Lengkap <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  title="Nama Pelanggan"
                  value={formData.nama}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, nama: e.target.value })
                  }
                  placeholder="Misal: Budi Santoso"
                  className="bg-[#0f1117] border border-white/8 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#f59e0b]/50 transition-all placeholder:text-gray-600"
                />
              </div>

              {/* Input Form Baru untuk NIS/NIP */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  NIS / NIP{" "}
                  <span className="text-gray-500 lowercase">(Opsional)</span>
                </label>
                <input
                  type="text"
                  title="NIS atau NIP"
                  value={formData.nis_nip}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, nis_nip: e.target.value })
                  }
                  placeholder="Masukkan Nomor Induk..."
                  className="bg-[#0f1117] border border-white/8 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#f59e0b]/50 transition-all placeholder:text-gray-600"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </label>
                <select
                  title="Pilih Status"
                  value={formData.status}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="bg-[#0f1117] border border-white/8 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#f59e0b]/50 transition-all"
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Non-Aktif</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/5 mt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  title="Batalkan Proses"
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  title={
                    isSaving
                      ? "Sedang memproses penyimpanan"
                      : "Simpan data ke sistem"
                  }
                  className="px-6 py-2 text-sm font-semibold bg-[#f59e0b] hover:bg-[#d97706] disabled:opacity-50 text-white rounded-xl transition-all"
                >
                  {isSaving ? "Menyimpan..." : editingId ? "Update" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
