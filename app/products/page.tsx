"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Trash2, Edit2, Plus, Download } from "lucide-react";

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase.from("products").select("*");
      setProducts(data || []);
    }
    fetchProducts();
  }, []);

  return (
    <div className="p-8 bg-[#0f1117] text-gray-200 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Master Produk</h1>
        <div className="flex gap-2">
          <button className="bg-transparent border border-gray-600 text-gray-300 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-[#1a1f2b]">
            <Download size={18} /> Cetak PDF
          </button>
          <button className="bg-amber-500 text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2">
            <Plus size={18} /> Tambah Produk
          </button>
        </div>
      </div>

      <div className="bg-[#141820] border border-white/5 rounded-xl overflow-hidden">
        {/* Search Bar Placeholder */}
        <div className="p-4 border-b border-white/5">
          <input
            type="text"
            placeholder="Cari produk..."
            className="w-full bg-[#0f1117] border border-white/10 rounded-lg p-2 text-sm text-gray-300"
          />
        </div>

        <table className="w-full text-left">
          <thead className="text-gray-500 text-xs uppercase">
            <tr>
              <th className="p-4">Kd. Produk</th>
              <th className="p-4">Nama</th>
              <th className="p-4">Harga Jual</th>
              <th className="p-4">Stok</th>
              <th className="p-4">Satuan</th>
              <th className="p-4">Kategori</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr
                key={p.id}
                className="border-t border-white/5 hover:bg-white/5"
              >
                <td className="p-4">
                  <span className="bg-[#1a1f2b] text-amber-500 px-2 py-1 rounded text-xs font-bold">
                    {p.code}
                  </span>
                </td>
                <td className="p-4 font-medium">{p.name}</td>
                <td className="p-4">
                  Rp {Number(p.price).toLocaleString("id-ID")}
                </td>
                <td className="p-4">
                  <span className="bg-green-900/30 text-green-400 px-2 py-1 rounded text-xs font-bold">
                    {p.stock}
                  </span>
                </td>
                <td className="p-4">{p.unit}</td>
                <td className="p-4">{p.category}</td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-3">
                    <button
                      aria-label="Edit Produk"
                      className="text-gray-500 hover:text-white"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      aria-label="Hapus Produk"
                      className="text-gray-500 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
