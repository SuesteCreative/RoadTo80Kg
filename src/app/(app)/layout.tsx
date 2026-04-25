import Link from "next/link";
import Image from "next/image";
import { auth, signOut } from "@/lib/auth/config";
import { Utensils, Scale, ListChecks, Dumbbell, User, Home, Package, Book, LogOut, Settings } from "lucide-react";

const NAV = [
  { href: "/", label: "Hoje", icon: Home },
  { href: "/perfil", label: "Perfil", icon: User },
  { href: "/peso", label: "Peso", icon: Scale },
  { href: "/refeicoes", label: "Refeições", icon: Utensils },
  { href: "/receitas", label: "Receitas", icon: Book },
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/compras", label: "Compras", icon: ListChecks },
  { href: "/treinos", label: "Treinos", icon: Dumbbell },
  { href: "/definicoes", label: "Definições", icon: Settings },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <div className="relative flex min-h-screen flex-col">
      <header className="relative border-b border-border/70 bg-paper/60 backdrop-blur-sm">
        <div className="topo pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative mx-auto flex max-w-6xl items-baseline justify-between gap-4 px-6 pt-6 pb-2">
          <Link href="/" className="group flex items-center">
            <Image
              src="/brand/logo-color.svg"
              alt="Road to 80 Kg"
              width={170}
              height={108}
              priority
              className="h-10 w-auto"
            />
            <span className="sr-only">Road to 80 Kg</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-[13px] text-muted-foreground sm:inline">
              {session?.user?.name}
            </span>
            <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
              <button
                type="submit"
                className="group flex items-center gap-1.5 rounded-full border border-border/80 bg-background/60 px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-primary"
              >
                <LogOut className="size-3.5" />
                <span>Sair</span>
              </button>
            </form>
          </div>
        </div>
        <nav className="relative mx-auto max-w-6xl overflow-x-auto px-4 pb-3 pt-1">
          <ul className="flex gap-1">
            {NAV.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="group flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] text-foreground/70 transition-colors hover:bg-secondary/70 hover:text-foreground"
                >
                  <Icon className="size-3.5 text-muted-foreground group-hover:text-primary" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-6">
        {children}
      </main>
      <footer className="border-t border-border/70 py-6">
        <p className="mx-auto max-w-6xl px-6 text-xs text-muted-foreground">
          Expedição pessoal · Lisboa · Continente.pt
        </p>
      </footer>
    </div>
  );
}
