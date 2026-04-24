import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RoadTo80Kg",
  description: "Objectivo: 80 kg — planeamento de refeições e treinos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
