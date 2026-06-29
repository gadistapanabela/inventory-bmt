"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { Store, KeyRound, ShieldCheck, Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [validSession, setValidSession] = useState(false);

  useEffect(() => {
    // Cek apakah ada session aktif dari link reset
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setValidSession(true);
      } else {
        setErrorMsg("Link reset tidak valid atau sudah kadaluarsa. Silakan minta link baru.");
      }
    });
  }, []);

  const handleResetPassword = async () => {
    setLoading(true);
    setErrorMsg("");

    if (!password || !confirmPassword) {
      setErrorMsg("Semua field harus diisi.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password minimal 6 karakter.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Konfirmasi password tidak cocok.");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setErrorMsg("Gagal mereset password: " + error.message);
      } else {
        setSuccessMsg("Password berhasil diubah! Anda akan diarahkan ke halaman login...");
        setTimeout(() => {
          supabase.auth.signOut();
          router.push("/");
        }, 3000);
      }
    } catch (err) {
      setErrorMsg("Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Bagian Kiri */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#111] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-luminosity"></div>
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#f5a623] rounded-full mix-blend-screen filter blur-[120px] opacity-20"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#f5a623] rounded-full mix-blend-screen filter blur-[120px] opacity-10"></div>

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

      {/* Bagian Kanan */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <div className="absolute top-0 right-0 w-full h-96 bg-[#f5a623] rounded-full mix-blend-screen filter blur-[150px] opacity-10 lg:hidden"></div>

        <div className="w-full max-w-md relative z-10">
          {/* Header */}
          <div className="mb-10">
            <div className="w-14 h-14 bg-[#f5a623]/10 rounded-2xl flex items-center justify-center mb-6">
              <KeyRound size={28} className="text-[#f5a623]" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Reset Password</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Masukkan password baru untuk akun Admin Anda.
            </p>
          </div>

          {/* Alert Error */}
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-4 rounded-xl mb-6">
              {errorMsg}
            </div>
          )}

          {/* Alert Sukses */}
          {successMsg && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-400 text-sm p-4 rounded-xl mb-6">
              {successMsg}
            </div>
          )}

          {/* Form */}
          {validSession && !successMsg && (
            <div className="flex flex-col gap-5">
              {/* Password Baru */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 tracking-wider">
                  PASSWORD BARU
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-[#1a1a1a] border border-gray-800 text-white px-5 py-4 rounded-xl w-full focus:outline-none focus:border-[#f5a623] focus:ring-1 focus:ring-[#f5a623] transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Konfirmasi Password */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 tracking-wider">
                  KONFIRMASI PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Ulangi password baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleResetPassword();
                    }}
                    className="bg-[#1a1a1a] border border-gray-800 text-white px-5 py-4 rounded-xl w-full focus:outline-none focus:border-[#f5a623] focus:ring-1 focus:ring-[#f5a623] transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetPassword}
                disabled={loading}
                className="w-full bg-[#f5a623] hover:bg-[#e09612] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold px-6 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(245,166,35,0.3)] hover:shadow-[0_0_30px_rgba(245,166,35,0.5)] flex items-center justify-center gap-2 mt-2 active:scale-95"
              >
                {loading ? "Menyimpan..." : "Simpan Password Baru"}
              </button>
            </div>
          )}

          <div className="mt-12 text-center lg:text-left text-sm text-gray-600">
            &copy; 2026 BMT SMK Assyafi'iyah. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
