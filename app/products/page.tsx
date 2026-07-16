"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Trash2, Edit2, Plus } from "lucide-react";

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
        <button className="bg-amber-500 text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2">
          <Plus size={18} /> Tambah Produk
        </button>
      </div>

      <div className="bg-[#141820] border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#1a1f2b] text-gray-400 text-sm">
            <tr>
              <th className="p-4">KD. PRODUK</th>
              <th className="p-4">NAMA</th>
              <th className="p-4">HARGA JUAL</th>
              <th className="p-4">STOK</th>
              <th className="p-4">SATUAN</th>
              <th className="p-4">KATEGORI</th>
              <th className="p-4 text-center">AKSI</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-white/5">
                <td className="p-4 text-amber-500 font-medium">{p.code}</td>
                <td className="p-4">{p.name}</td>
                <td className="p-4">
                  Rp {Number(p.price).toLocaleString("id-ID")}
                </td>
                <td className="p-4">
                  <span className="bg-green-900/30 text-green-400 px-2 py-1 rounded text-sm">
                    {p.stock}
                  </span>
                </td>
                <td className="p-4">{p.unit}</td>
                <td className="p-4">{p.category}</td>
                <td className="p-4 flex justify-center gap-2">
                  <button
                    className="text-gray-400 hover:text-white"
                    aria-label="Edit Produk"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    className="text-gray-400 hover:text-red-500"
                    aria-label="Hapus Produk"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
