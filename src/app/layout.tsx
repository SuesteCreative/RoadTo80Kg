import type { Metadata } from "next";
import { Instrument_Serif, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});
const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RoadTo80Kg",
  description: "Diário pessoal — rumo a 80 kg",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-PT"
      className={`${instrumentSerif.variable} ${interTight.variable} ${jetbrains.variable}`}
    >
      <body className="relative min-h-screen antialiased">
        <div className="relative z-10">{children}</div>
        <Toaster
          position="bottom-center"
          toastOptions={{
            classNames: {
              toast:
                "!bg-[hsl(var(--card))] !text-[hsl(var(--foreground))] !border !border-[hsl(var(--border))] !shadow-[0_8px_32px_rgba(30,20,15,.12)] !font-sans",
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
