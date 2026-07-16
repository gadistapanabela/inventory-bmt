"use client";

import { useState, useEffect } from "react";
import StatCard from "../Components/StatCard";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalIncome: 0,
    totalCustomers: 0,
    incomeChartData: [{ value: 0 }],
    orderChartData: [{ value: 0 }],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkRoleAndFetchData() {
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
        alert("Akses Ditolak! Petugas tidak bisa membuka Dashboard.");
        router.push("/pos");
        return;
      }

      const { data: ordersData } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: true });
      const { data: customersData } = await supabase
        .from("customers")
        .select("*");

      const orders = ordersData || [];
      const customers = customersData || [];
      const totalOrders = orders.length;
      const totalIncome = orders.reduce(
        (sum, order) => sum + Number(order.total_price),
        0,
      );
      const totalCustomers = customers.length;

      const recentOrders = orders.slice(-6);
      const incomeChartData =
        recentOrders.length > 0
          ? recentOrders.map((o) => ({ value: Number(o.total_price) }))
          : [{ value: 0 }];
      const orderChartData =
        recentOrders.length > 0
          ? recentOrders.map((_, index) => ({ value: index + 1 }))
          : [{ value: 0 }];

      setStats({
        totalOrders,
        totalIncome,
        totalCustomers,
        incomeChartData,
        orderChartData,
      });
      setIsLoading(false);
    }
    checkRoleAndFetchData();
  }, [router]);

  return (
    <div className="bg-[#0f1117] text-gray-200 min-h-[calc(100vh-4rem)] -m-8 p-8 flex flex-col gap-6 relative overflow-hidden z-0">
      <div className="absolute top-10 left-10 w-96 h-96 bg-[#f59e0b] rounded-full mix-blend-screen filter blur-[150px] opacity-[0.08] pointer-events-none -z-10"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#ea580c] rounded-full mix-blend-screen filter blur-[150px] opacity-[0.05] pointer-events-none -z-10"></div>

      <div className="flex justify-between items-start mb-4">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          Halaman Utama
        </h1>
      </div>

      {isLoading ? (
        <div className="text-amber-500 animate-pulse font-medium bg-[#141820] p-6 rounded-2xl border border-amber-900/30 text-center">
          Mengambil data real-time...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Jumlah Pesanan"
            value={stats.totalOrders.toString()}
            subtitle="Total pesanan di sistem"
            data={stats.orderChartData}
          />
          <StatCard
            title="Pendapatan"
            value={`Rp ${stats.totalIncome.toLocaleString("id-ID")}`}
            subtitle="Total pendapatan keseluruhan"
            data={stats.incomeChartData}
          />
          <StatCard
            title="Jumlah Pelanggan"
            value={stats.totalCustomers.toString()}
            subtitle="Total pelanggan terdaftar"
            data={stats.orderChartData}
          />
        </div>
      )}
    </div>
  );
}
