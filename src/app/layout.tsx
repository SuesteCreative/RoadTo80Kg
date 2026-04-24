import type { Metadata } from "next";
import { Inter_Tight, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Road to 80 Kg",
    template: "%s · Road to 80 Kg",
  },
  description: "Diário pessoal de cut — nutrição, treinos e compras no Continente.",
  applicationName: "Road to 80 Kg",
  appleWebApp: { capable: true, title: "Road to 80 Kg", statusBarStyle: "black-translucent" },
  openGraph: {
    title: "Road to 80 Kg",
    description: "Diário pessoal de cut — nutrição, treinos e compras.",
    type: "website",
    locale: "pt_PT",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-PT"
      className={`${interTight.variable} ${geistMono.variable}`}
    >
      <body className="relative min-h-screen antialiased">
        <div className="relative z-10">{children}</div>
        <Toaster
          position="bottom-center"
          toastOptions={{
            classNames: {
              toast:
                "!bg-[hsl(var(--card))] !text-[hsl(var(--foreground))] !border !border-[hsl(var(--border))] !shadow-[0_8px_32px_rgba(30,20,15,.12)]",
              description: "!text-[hsl(var(--muted-foreground))]",
              success: "!border-[hsl(var(--accent))]",
              error: "!border-[hsl(var(--destructive))]",
            },
          }}
        />
      </body>
    </html>
  );
}
