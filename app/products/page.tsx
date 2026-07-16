"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Trash2, Edit2, Plus, Download } from "lucide-react";
import { useRouter } from "next/navigation"; // Import useRouter untuk navigasi

export default function Products() {
  const router = useRouter(); // Inisialisasi router
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase.from("products").select("*");
      setProducts(data || []);
    }
    fetchProducts();
  }, []);

  // Fungsi navigasi ke halaman tambah produk
  const handleAddProduct = () => {
    router.push("/products/add"); // Pastikan Anda sudah punya file ini di folder app/products/add/page.tsx
  };

  return (
    <div className="p-8 bg-[#0f1117] text-gray-200 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Master Produk</h1>
        <div className="flex gap-2">
          <button className="bg-transparent border border-gray-600 text-gray-300 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-[#1a1f2b]">
            <Download size={18} /> Cetak PDF
          </button>
          <button
            onClick={handleAddProduct} // Menambahkan fungsi klik
            className="bg-amber-500 text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2"
          >
            <Plus size={18} /> Tambah Produk
          </button>
        </div>
      </div>

      <div className="bg-[#141820] border border-white/5 rounded-xl overflow-hidden">
        {/* ... sisa tabel tetap sama ... */}
        <table className="w-full text-left">
          {/* ... isi tabel sama seperti kode sebelumnya ... */}
        </table>
      </div>
    </div>
  );
}
