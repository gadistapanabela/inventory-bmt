"use client";

import { usePathname } from "next/navigation";
import DashboardLayout from "./Components/DashboardLayout";
import "./globals.css";

const authPages = ["/", "/forgot-password", "/reset-password"];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = authPages.includes(pathname);

  return (
    <html lang="en">
      <body>
        {isAuthPage ? children : <DashboardLayout>{children}</DashboardLayout>}
      </body>
    </html>
  );
}
