"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  Users,
  LogOut,
  Store,
  ClipboardList,
  Truck,
  PackagePlus,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const navItems = [
  { href: "/dashboard", label: "Dasbor", icon: LayoutDashboard },
  { href: "/pos", label: "Kasir", icon: Store },
  { href: "/orders", label: "Barang Keluar", icon: ClipboardList },
  { href: "/barang-masuk", label: "Barang Masuk", icon: PackagePlus },
  { href: "/products", label: "Produk", icon: Package },
  { href: "/customers", label: "Pelanggan", icon: Users },
  { href: "/supplier", label: "Pemasok", icon: Truck },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        if (user.email) setUserEmail(user.email);

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile) setUserRole(profile.role);
      }
    };

    fetchUserAndRole();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#profile-menu")) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (pathname === "/" || pathname === "/login") {
    return (
      <div className="min-h-screen bg-[#0f1117] text-gray-200">{children}</div>
    );
  }

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");

  const initials = userEmail ? userEmail[0].toUpperCase() : "A";

  const filteredNavItems = navItems.filter((item) => {
    if (userRole === "petugas") {
      return item.href === "/pos" || item.href === "/orders";
    }
    return true;
  });

  return (
    <div className="flex h-screen bg-[#0f1117] text-gray-200 overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-56 bg-[#141820] border-r border-white/5 flex flex-col shrink-0">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
          <div className="w-9 h-9 bg-white/5 rounded-xl p-1 flex items-center justify-center shrink-0">
            <img
              src="/logo-smk.png"
              alt="Logo SMK As-Syafiiyah"
              className="w-8 h-8 object-contain"
            />
          </div>
          <span className="text-xs font-semibold text-white leading-tight">
            BMT SMK
            <br />
            Assyafi'iyah
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          {filteredNavItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              // Active state diubah ke warna kuning (#f59e0b)
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                isActive(href)
                  ? "bg-[#f59e0b]/10 text-[#f59e0b] font-medium"
                  : "text-gray-500 hover:text-gray-200 hover:bg-white/5"
              }`}
            >
              <Icon size={16} className="shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-[#141820] border-b border-white/5 flex items-center justify-between px-6 shrink-0">
          <span className="text-sm text-gray-500 capitalize"></span>

          <div className="relative" id="profile-menu">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              // Tombol inisial profile diubah ke kuning
              className="w-8 h-8 bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#f59e0b] rounded-full flex items-center justify-center text-xs font-bold hover:bg-[#f59e0b]/20 transition-colors"
            >
              {initials}
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-[#141820] border border-white/10 rounded-xl shadow-2xl py-2 z-50">
                <div className="px-4 py-2 border-b border-white/5">
                  <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                  {/* Teks role di menu profile diubah ke kuning */}
                  <p className="text-[10px] text-[#f59e0b] uppercase font-bold mt-0.5">
                    {userRole || "..."}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:text-red-400 hover:bg-red-400/5 transition-colors mt-1"
                >
                  <LogOut size={14} /> Keluar
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-[#0f1117] p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
