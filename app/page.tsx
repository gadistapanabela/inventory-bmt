"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { Store, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (profileError || !profile) {
          router.push("/pos");
        } else {
          if (profile.role === "admin") {
            router.push("/dashboard");
          } else {
            router.push("/pos");
          }
        }
      }
    } catch (err) {
      setErrorMsg("Terjadi kesalahan sistem saat mencoba login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* =========================================
          BAGIAN KIRI: VISUAL & BRANDING (Hanya tampil di layar besar)
      ========================================= */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#111] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-luminosity"></div>

        {/* Efek Cahaya Oranye (Glowing) */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#f5a623] rounded-full mix-blend-screen filter blur-[120px] opacity-20"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#f5a623] rounded-full mix-blend-screen filter blur-[120px] opacity-10"></div>

        {/* Konten Kiri */}
        <div className="relative z-10 p-12 max-w-lg">
          <div className="w-16 h-16 bg-[#f5a623] rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-[#f5a623]/20">
            <Store size={32} className="text-black" />
          </div>
          <h1 className="text-5xl font-extrabold text-white mb-4 leading-tight">
            Sistem Informasi <br />
            <span className="text-[#f5a623]">Persediaan Barang</span>
          </h1>
          <p className="text-lg text-gray-400 mb-8 leading-relaxed">
            Kelola stok barang, transaksi kasir, dan laporan penjualan BMT SMK
            Assyafi'iyah Jakarta dalam satu platform modern yang terintegrasi.
          </p>

          <div className="flex items-center gap-3 text-sm font-medium text-gray-500 bg-[#1e1e1e]/50 backdrop-blur-md px-4 py-2 rounded-full w-max border border-gray-800">
            <ShieldCheck size={16} className="text-[#2ecc71]" />
            Akses Terenkripsi & Aman
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        {/* Efek Cahaya buat layar HP */}
        <div className="absolute top-0 right-0 w-full h-96 bg-[#f5a623] rounded-full mix-blend-screen filter blur-[150px] opacity-10 lg:hidden"></div>

        <div className="w-full max-w-md relative z-10">
          {/* Header Form */}
          <div className="mb-10 text-center lg:text-left">
            <div className="w-12 h-12 bg-[#f5a623]/10 text-[#f5a623] rounded-xl flex items-center justify-center mb-6 mx-auto lg:mx-0 lg:hidden">
              <Store size={24} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Selamat Datang di BMT SMK Assafi'iyah
            </h2>
          </div>

          {/* Alert Error */}
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-4 rounded-xl mb-6 flex items-center gap-2">
              <span className="font-bold">Error:</span>
              {errorMsg === "Invalid login credentials"
                ? "Email atau Password salah!"
                : errorMsg}
            </div>
          )}

          {/* Form */}
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-xs font-bold text-gray-400 tracking-wider"
              >
                EMAIL
              </label>
              <div className="relative group">
                <input
                  id="email"
                  type="email"
                  placeholder="Masukkan Email Anda"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#1a1a1a] border border-gray-800 text-white px-5 py-4 rounded-xl w-full focus:outline-none focus:border-[#f5a623] focus:ring-1 focus:ring-[#f5a623] transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="password"
                  className="text-xs font-bold text-gray-400 tracking-wider"
                >
                  PASSWORD
                </label>
                {/* ===== LINK LUPA SANDI ===== */}
                <button
                  type="button"
                  onClick={() => router.push("/forgot-password")}
                  className="text-xs text-[#f5a623] hover:text-[#e09612] transition-colors font-medium"
                >
                  Lupa Sandi?
                </button>
              </div>
              <div className="relative group">
                <input
                  id="password"
                  type="password"
                  placeholder="Masukkan Password Anda"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLogin(e);
                  }}
                  className="bg-[#1a1a1a] border border-gray-800 text-white px-5 py-4 rounded-xl w-full focus:outline-none focus:border-[#f5a623] focus:ring-1 focus:ring-[#f5a623] transition-all"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-[#f5a623] hover:bg-[#e09612] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold px-6 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(245,166,35,0.3)] hover:shadow-[0_0_30px_rgba(245,166,35,0.5)] flex items-center justify-center gap-2 mt-4 active:scale-95"
            >
              {loading ? "Memverifikasi..." : "Masuk"}
            </button>
          </div>

          <div className="mt-12 text-center lg:text-left text-sm text-gray-600">
            &copy; 2026 BMT SMK Assyafi'iyah. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
