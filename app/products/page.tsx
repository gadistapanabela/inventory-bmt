"use client";

import { useState, useEffect } from "react";
import { Download, Search, Edit, X, Package, Trash2, Plus } from "lucide-react";
import { supabase } from "../../lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useRouter } from "next/navigation";

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nama: "",
    harga_beli: "",
    harga: "",
    satuan: "pcs",
    kategori: "ATK",
  });

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err: any) {
      console.error("Error fetching products:", err.message);
    }
  };

  useEffect(() => {
    let isMounted = true;
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

      if (isMounted) {
        await fetchProducts();
        setIsLoading(false);
      }
    };

    init();
    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);

    const payload = {
      nama: formData.nama,
      harga_beli: parseFloat(formData.harga_beli) || 0,
      harga: parseFloat(formData.harga) || 0,
      satuan: formData.satuan,
      kategori: formData.kategori,
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { data: existingProduct } = await supabase
          .from("products")
          .select("id")
          .ilike("nama", formData.nama)
          .maybeSingle();

        if (existingProduct) {
          alert("Gagal: Nama produk ini sudah terdaftar di sistem!");
          setIsSaving(false);
          return;
        }

        const { error } = await supabase
          .from("products")
          .insert([{ ...payload, stok: 0 }]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      setEditingId(null);
      setFormData({
        nama: "",
        harga_beli: "",
        harga: "",
        satuan: "pcs",
        kategori: "ATK",
      });
      await fetchProducts();
    } catch (err: any) {
      alert("Gagal menyimpan data: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus produk ini?")) return;

    const product = products.find((p) => p.id === id);
    const { count } = await supabase
      .from("order_items")
      .select("*", { count: "exact", head: true })
      .eq("kd_prod", product?.kd_produk);

    if (count && count > 0) {
      alert(
        `Produk tidak bisa dihapus karena sudah memiliki riwayat transaksi keluar.`,
      );
      return;
    }

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) alert("Gagal hapus: " + error.message);
    else await fetchProducts();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Laporan Data Produk", 14, 20);
    doc.text("BMT SMK Assyafi'iyah", 14, 26);
    doc.setFontSize(10);
    doc.text(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`, 14, 33);

    autoTable(doc, {
      head: [
        [
          "Kd. Produk",
          "Nama Produk",
          "Harga Beli",
          "Harga Jual",
          "Laba",
          "Stok",
          "Satuan",
          "Kategori",
        ],
      ],
      body: products.map((p) => {
        const laba = (p.harga || 0) - (p.harga_beli || 0);
        return [
          p.kd_produk || "-",
          p.nama || "-",
          `Rp ${Number(p.harga_beli || 0).toLocaleString("id-ID")}`,
          `Rp ${Number(p.harga || 0).toLocaleString("id-ID")}`,
          `Rp ${Number(laba).toLocaleString("id-ID")}`,
          p.stok?.toString() || "0",
          p.satuan || "-",
          p.kategori || "-",
        ];
      }),
      startY: 40,
      theme: "grid",
      headStyles: { fillColor: [245, 158, 11] },
      styles: { fontSize: 8 },
    });
    doc.save(`Products_Report_${new Date().getTime()}.pdf`);
  };

  const filtered = products.filter((p) =>
    [p.kd_produk, p.nama, p.kategori, p.satuan]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="w-full relative">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Master Produk</h1>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={exportToPDF}
              className="flex items-center gap-2 px-4 py-2 bg-[#141820] border border-white/8 text-gray-300 hover:text-white rounded-xl text-sm transition-all shadow-lg"
            >
              <Download size={15} /> Cetak PDF
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setFormData({
                  nama: "",
                  harga_beli: "",
                  harga: "",
                  satuan: "pcs",
                  kategori: "ATK",
                });
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#f59e0b] hover:bg-[#d97706] text-white rounded-xl text-sm font-semibold transition-all shadow-lg"
            >
              <Plus size={15} /> Tambah Produk
            </button>
          </div>
        </div>

        {/* Tabel */}
        <div className="bg-[#141820] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-white/5 flex justify-end">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                size={14}
              />
              <input
                type="text"
                placeholder="Cari produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-[#0f1117] border border-white/8 text-white text-sm pl-9 pr-4 py-2 rounded-lg w-56 focus:outline-none focus:border-[#f59e0b]/50 transition-all placeholder:text-gray-600"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">Kd. Produk</th>
                  <th className="px-5 py-3 font-medium">Nama</th>
                  <th className="px-5 py-3 font-medium">Harga Jual</th>
                  <th className="px-5 py-3 font-medium">Stok</th>
                  <th className="px-5 py-3 font-medium">Satuan</th>
                  <th className="px-5 py-3 font-medium">Kategori</th>
                  <th className="px-5 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-10 text-center text-gray-400 animate-pulse"
                    >
                      Memuat data produk...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-10 text-center text-gray-500"
                    >
                      Produk tidak ditemukan.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <span className="bg-[#1a1f2b] text-[#f59e0b] text-xs font-mono font-bold px-2.5 py-1 rounded-lg">
                          {p.kd_produk || "-"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-white font-medium">
                        {p.nama}
                      </td>
                      <td className="px-5 py-4 text-gray-300">
                        Rp {Number(p.harga || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg ${p.stok <= 0 ? "bg-red-400/10 text-red-400" : p.stok <= 5 ? "bg-yellow-400/10 text-yellow-400" : "bg-green-400/10 text-green-400"}`}
                        >
                          {p.stok ?? 0}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-400">
                        {p.satuan || "-"}
                      </td>
                      <td className="px-5 py-4 text-gray-400">
                        {p.kategori || "-"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            aria-label="Edit Produk"
                            onClick={() => {
                              setEditingId(p.id);
                              setFormData({
                                nama: p.nama || "",
                                harga_beli: p.harga_beli?.toString() || "",
                                harga: p.harga?.toString() || "",
                                satuan: p.satuan || "pcs",
                                kategori: p.kategori || "ATK",
                              });
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-gray-500 hover:text-white rounded-lg transition-all"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            aria-label="Hapus Produk"
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg transition-all"
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
      </div>

      {/* MODAL FIXED */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#141820] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-[#171c26]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#f59e0b]/10 rounded-lg flex items-center justify-center">
                  <Package size={16} className="text-[#f59e0b]" />
                </div>
                <h2 className="text-base font-semibold text-white">
                  {editingId
                    ? "Edit Master Produk"
                    : "Tambah Master Produk Baru"}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Tutup Modal"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors bg-white/5 hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Input */}
            <form
              onSubmit={handleSave}
              className="p-6 flex flex-col gap-4 bg-[#141820]"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Nama Produk <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) =>
                    setFormData({ ...formData, nama: e.target.value })
                  }
                  placeholder="Cth: Pulpen Standar"
                  className="bg-[#0f1117] border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#f59e0b] transition-all placeholder:text-gray-600 w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Harga Beli Pemasok <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.harga_beli}
                    onChange={(e) =>
                      setFormData({ ...formData, harga_beli: e.target.value })
                    }
                    placeholder="Rp 2.000"
                    className="bg-[#0f1117] border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#f59e0b] transition-all placeholder:text-gray-600 w-full"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Harga Jual Toko <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.harga}
                    onChange={(e) =>
                      setFormData({ ...formData, harga: e.target.value })
                    }
                    placeholder="Rp 3.000"
                    className="bg-[#0f1117] border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#f59e0b] transition-all placeholder:text-gray-600 w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Satuan
                  </label>
                  <select
                    value={formData.satuan}
                    onChange={(e) =>
                      setFormData({ ...formData, satuan: e.target.value })
                    }
                    className="bg-[#0f1117] border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#f59e0b] transition-all w-full cursor-pointer"
                  >
                    <option value="pcs">Pcs (Keping)</option>
                    <option value="kg">Kg (Kilogram)</option>
                    <option value="liter">Liter</option>
                    <option value="dus">Dus (Karton)</option>
                    <option value="lusin">Lusin</option>
                    <option value="pack">Pack</option>
                    <option value="botol">Botol</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Kategori
                  </label>
                  <select
                    value={formData.kategori}
                    onChange={(e) =>
                      setFormData({ ...formData, kategori: e.target.value })
                    }
                    className="bg-[#0f1117] border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#f59e0b] transition-all w-full cursor-pointer"
                  >
                    <option value="ATK">ATK</option>
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                    <option value="P3K">P3K</option>
                    <option value="Seragam">Seragam</option>
                  </select>
                </div>
              </div>

              {!editingId && (
                <div className="bg-[#f59e0b]/5 border border-[#f59e0b]/10 rounded-xl px-4 py-3 mt-1">
                  <p className="text-xs text-gray-400 leading-relaxed">
                    💡 <b>Info:</b> Master produk baru otomatis dibuat dengan
                    nilai <b>Stok: 0</b>. Anda dapat mengisi jumlah kuantitas
                    stoknya lewat modul menu <b>Barang Masuk</b>.
                  </p>
                </div>
              )}

              {/* Aksi Tombol */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-white/5 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 text-sm font-semibold bg-[#f59e0b] hover:bg-[#d97706] disabled:opacity-50 text-white rounded-xl transition-all shadow-lg shadow-[#f59e0b]/20"
                >
                  {isSaving ? "Menyimpan..." : "Simpan Produk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
