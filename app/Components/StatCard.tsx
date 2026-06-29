"use client";

import { LineChart, Line, ResponsiveContainer } from "recharts";

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  data: { value: number }[];
}

export default function StatCard({
  title,
  value,
  subtitle,
  data,
}: StatCardProps) {
  return (
    // Background dan border hover disesuaikan dengan tema gelap & kuning
    <div className="bg-[#141820] backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-xl hover:border-[#f59e0b]/40 transition-all">
      {/* Judul Kartu - Warna Kuning/Amber */}
      <h3 className="text-[#f59e0b]/90 text-xs font-bold uppercase tracking-widest">
        {title}
      </h3>

      {/* Nilai Utama */}
      <div className="mt-2 flex items-baseline">
        <span className="text-3xl font-extrabold text-white tracking-tight">
          {value}
        </span>
      </div>

      {/* Grafik Garis (Warna Kuning Emas) */}
      <div className="h-16 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line
              type="monotone"
              dataKey="value"
              stroke="#f59e0b" // FIX: Diubah jadi Kuning Emas
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Subtitle / Deskripsi Bawah */}
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
        <div className="flex flex-col gap-[2px]">
          {/* Garis Indikator - Warna Kuning/Amber */}
          <div className="w-1 h-3 bg-[#f59e0b] rounded-full"></div>
        </div>
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-tighter">
          {subtitle}
        </p>
      </div>
    </div>
  );
}