import Link from "next/link";
import { auth, signOut } from "@/lib/auth/config";
import { Button } from "@/components/ui/button";
import { Utensils, Scale, ListChecks, Dumbbell, User, Home, Package, Book } from "lucide-react";

const NAV = [
  { href: "/", label: "Hoje", icon: Home },
  { href: "/perfil", label: "Perfil", icon: User },
  { href: "/peso", label: "Peso", icon: Scale },
  { href: "/refeicoes", label: "Refeições", icon: Utensils },
  { href: "/receitas", label: "Receitas", icon: Book },
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/compras", label: "Compras", icon: ListChecks },
  { href: "/treinos", label: "Treinos", icon: Dumbbell },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="font-semibold tracking-tight">RoadTo80Kg</Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">{session?.user?.name}</span>
            <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
              <Button type="submit" variant="ghost" size="sm">Sair</Button>
            </form>
          </div>
        </div>
        <nav className="mx-auto max-w-6xl overflow-x-auto px-4 pb-2">
          <ul className="flex gap-1">
            {NAV.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm hover:bg-accent"
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 p-4">{children}</main>
    </div>
  );
}
