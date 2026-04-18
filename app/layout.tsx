import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CờViệt – Cờ Dây Sao Đảng Chất Lượng Cao | Giao Hàng Toàn Quốc 24h",
  description:
    "Chuyên cung cấp cờ dây sao đảng vải phi bóng cao cấp. Màu sắc chuẩn, đường may chắc, giao hàng toàn quốc trong 24h. Giá tốt nhất.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}