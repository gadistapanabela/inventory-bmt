"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  Package,
  Barcode,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import jsPDF from "jspdf"; 

export default function POSPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Ref untuk kotak pencarian biar siap di-scan kapan aja
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 1. Ambil Data Produk & Customer dari Supabase
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      const { data: p, error: pErr } = await supabase
        .from("products")
        .select("*")
        .order("nama", { ascending: true });
        
      const { data: c, error: cErr } = await supabase
        .from("customers")
        .select("*")
        .order("nama", { ascending: true });

      if (pErr) console.error("Error Produk:", pErr.message);
      if (cErr) console.error("Error Customer:", cErr.message);

      setProducts(p || []);
      setCustomers(c || []);
      setIsLoading(false);
      
      // Otomatis fokus ke kotak pencarian pas halaman dibuka
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    };
    fetchData();
  }, []);

  // 2. Fungsi Keranjang Belanja
  const addToCart = (product: any) => {
    if (product.stok <= 0) {
      alert(`Maaf bos, stok ${product.nama} lagi kosong!`);
      return;
    }

    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      if (existing.qty < product.stok) {
        setCart(
          cart.map((item) =>
            item.id === product.id ? { ...item, qty: item.qty + 1 } : item,
          ),
        );
      } else {
        alert("Stok barang ini sudah mencapai batas maksimal!");
      }
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const removeFromCart = (id: string) =>
    setCart(cart.filter((item) => item.id !== id));

  const updateQty = (id: string, delta: number) => {
    setCart(
      cart.map((item) => {
        if (item.id === id) {
          const newQty = item.qty + delta;
          return newQty > 0 && newQty <= item.stok
            ? { ...item, qty: newQty }
            : item;
        }
        return item;
      }),
    );
  };

  const totalTagihan = cart.reduce(
    (sum, item) => sum + item.harga * item.qty,
    0,
  );

  // 3. Fungsi Desain dan Cetak Struk (Format Kertas Thermal Kasir 58mm)
  const cetakStruk = (orderId: string, namaPelanggan: string) => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [58, 80 + (cart.length * 10)], 
    });

    doc.setFontSize(10);
    doc.text("BMT SMK", 29, 10, { align: "center" });
    doc.text("Assyafi'iyah", 29, 14, { align: "center" });
    
    doc.setFontSize(8);
    doc.text("--------------------------------", 29, 18, { align: "center" });

    const shortId = orderId.length > 10 ? orderId.substring(0, 8) : orderId;
    doc.text(`No : ${shortId}`, 2, 22);
    doc.text(`Tgl: ${new Date().toLocaleString("id-ID")}`, 2, 26);
    doc.text(`Plg: ${namaPelanggan}`, 2, 30);

    doc.text("--------------------------------", 29, 34, { align: "center" });

    let y = 38;
    cart.forEach((item) => {
      const namaBarang = item.nama.length > 20 ? item.nama.substring(0, 20) + ".." : item.nama;
      doc.text(namaBarang, 2, y);
      y += 4;
      doc.text(`${item.qty} x Rp ${Number(item.harga).toLocaleString("id-ID")}`, 2, y);
      doc.text(`Rp ${(item.qty * item.harga).toLocaleString("id-ID")}`, 56, y, { align: "right" });
      y += 6;
    });

    doc.text("--------------------------------", 29, y, { align: "center" });
    y += 5;

    doc.setFontSize(10);
    doc.text("TOTAL:", 2, y);
    doc.text(`Rp ${totalTagihan.toLocaleString("id-ID")}`, 56, y, { align: "right" });

    y += 8;
    
    doc.setFontSize(8);
    doc.text("Terima Kasih", 29, y, { align: "center" });
    doc.text("Telah Berbelanja!", 29, y + 4, { align: "center" });

    doc.save(`Struk_${shortId}.pdf`);
  };

  // 4. Proses Transaksi (Simpan DB & Cetak)
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    if (!selectedCustomer) {
      alert("Harap Memilih Pelanggan Terlebih Dahulu!");
      return;
    }

    setIsProcessing(true);

    try {
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert([{ kd_plgn: selectedCustomer, total_price: totalTagihan }])
        .select()
        .single();

      if (orderErr) throw orderErr;

      const details = cart.map((item) => ({
        order_id: order.id,
        kd_prod: item.kd_prod,
        qty: item.qty,
        subtotal: item.harga * item.qty,
      }));

      const { error: detErr } = await supabase.from("order_items").insert(details);
      if (detErr) throw detErr;

      const customerData = customers.find(c => c.kd_plgn === selectedCustomer);
      const namaCust = customerData ? customerData.nama : selectedCustomer;
      const transaksiId = order.kd_trans_klr || order.id;
      
      // Panggil fungsi cetak struk
      cetakStruk(transaksiId, namaCust);

      alert("Transaksi Berhasil Disimpan & Struk Sedang Diunduh!");
      setCart([]);
      setSelectedCustomer(""); 

      // Refresh data produk agar stok terupdate di layar
      const { data: fresh } = await supabase
        .from("products")
        .select("*")
        .order("nama", { ascending: true });
      setProducts(fresh || []);
    } catch (error) {
      const err = error as Error;
      alert("Gagal memproses transaksi: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // 5. Handle Input dari Scanner Barcode
  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const scannedProduct = products.find(
        (p) => p.kd_prod?.toLowerCase() === search.toLowerCase()
      );

      if (scannedProduct) {
        addToCart(scannedProduct);
        setSearch("");
      } else if (search.trim() !== "") {
        alert(`Barang dengan kode barcode "${search}" tidak ditemukan!`);
        setSearch("");
      }
    }
  };

  // Logika Filter Pencarian Biasa
  const filteredProducts = products.filter(
    (p) =>
      p.nama?.toLowerCase().includes(search.toLowerCase()) ||
      p.kd_prod?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] gap-6">
      {/* SISI KIRI: DAFTAR PRODUK */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="relative">
          <Barcode
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            size={18}
          />
          <input
            ref={searchInputRef}
            type="text"
            title="Scan Barcode / Cari Produk"
            aria-label="Scan Barcode atau Cari Produk"
            placeholder="Scan barcode atau ketik nama produk..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearch(e.target.value)
            }
            onKeyDown={handleBarcodeScan} 
            className="w-full bg-[#141820] border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-white focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b]/20 outline-none transition-all"
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {isLoading ? (
            <div className="text-center py-20 text-gray-500 animate-pulse">
              Memuat produk...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              Produk tidak ditemukan.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className={`bg-[#141820] border border-white/5 p-4 rounded-2xl hover:border-[#f59e0b]/50 cursor-pointer transition-all group flex flex-col justify-between ${
                    p.stok <= 0 ? "opacity-50 grayscale" : ""
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="bg-[#f59e0b]/10 text-[#f59e0b] text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">
                        {p.kd_prod}
                      </span>
                      <span className="text-[10px] text-gray-500 uppercase">
                        {p.kategori || "Umum"}
                      </span>
                    </div>
                    <div className="text-white font-semibold group-hover:text-[#f59e0b] transition-colors">
                      {p.nama}
                    </div>
                    <div className="text-[#f59e0b] font-bold mt-1">
                      Rp {Number(p.harga).toLocaleString("id-ID")}
                    </div>
                  </div>

                  <div className="mt-4 flex justify-between items-center pt-3 border-t border-white/5">
                    <span className="text-xs text-gray-500">
                      Stok:{" "}
                      <span
                        className={
                          p.stok <= 0 
                            ? "text-red-500 font-bold" 
                            : p.stok < 5 
                              ? "text-yellow-500" 
                              : "text-gray-300"
                        }
                      >
                        {p.stok <= 0 ? "Habis" : p.stok}
                      </span>{" "}
                      {p.stok > 0 && p.satuan}
                    </span>
                    <div className="w-7 h-7 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-[#f59e0b] group-hover:text-white text-gray-500 transition-all">
                      <Plus size={14} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SISI KANAN: KERANJANG BELANJA */}
      <div className="w-full lg:w-96 bg-[#141820] border border-white/5 rounded-3xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header Keranjang */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-[#f59e0b]" />
            <h2 className="font-bold text-white">Keranjang</h2>
          </div>
          <span className="bg-[#f59e0b] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {cart.length} Item
          </span>
        </div>

        {/* Pilih Pelanggan */}
        <div className="p-4 border-b border-white/5 bg-white/[0.01]">
          <label
            htmlFor="customerSelect"
            className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2 block"
          >
            Pilih Pelanggan <span className="text-red-400">*</span>
          </label>
          <select
            id="customerSelect"
            title="Pilih Pelanggan"
            aria-label="Pilih Pelanggan"
            className="w-full bg-[#0f1117] border border-white/10 text-white text-sm p-2.5 rounded-xl outline-none focus:border-[#f59e0b]/50"
            value={selectedCustomer}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setSelectedCustomer(e.target.value)
            }
          >
            <option value="" disabled>
              -- Pilih Pelanggan --
            </option>

            {customers.map((c) => (
              <option key={c.id} value={c.kd_plgn}>
                {c.nama}
              </option>
            ))}
          </select>
        </div>

        {/* List Item di Keranjang */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-2 opacity-50">
              <Package size={40} />
              <p className="text-sm italic">Keranjang kosong</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="bg-white/[0.03] p-3 rounded-2xl border border-white/5 hover:bg-white/[0.05] transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="text-xs font-medium text-white truncate w-40">
                    {item.nama}
                  </div>
                  <button
                    type="button"
                    title="Hapus"
                    aria-label="Hapus"
                    onClick={() => removeFromCart(item.id)}
                    className="text-gray-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 bg-[#0f1117] rounded-lg p-1 border border-white/5">
                    <button
                      type="button"
                      title="Kurangi"
                      aria-label="Kurangi"
                      onClick={() => updateQty(item.id, -1)}
                      className="p-1 text-gray-400 hover:text-white"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-xs text-[#f59e0b] font-bold w-5 text-center">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      title="Tambah"
                      aria-label="Tambah"
                      onClick={() => updateQty(item.id, 1)}
                      className="p-1 text-gray-400 hover:text-white"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className="text-xs text-white font-semibold">
                    Rp {(item.harga * item.qty).toLocaleString("id-ID")}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer: Total & Bayar */}
        <div className="p-6 bg-[#0f1117] border-t border-white/10 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Total Tagihan</span>
            <span className="text-xl font-bold text-[#f59e0b]">
              Rp {totalTagihan.toLocaleString("id-ID")}
            </span>
          </div>
          <button
            type="button"
            title="Bayar Sekarang"
            aria-label="Bayar Sekarang"
            disabled={cart.length === 0 || isProcessing}
            onClick={handleCheckout}
            className="w-full bg-[#f59e0b] hover:bg-[#d97706] disabled:opacity-50 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-[#f59e0b]/20 active:scale-[0.98]"
          >
            {isProcessing ? (
              "Memproses..."
            ) : (
              <>
                <CheckCircle size={20} /> Bayar Sekarang
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}