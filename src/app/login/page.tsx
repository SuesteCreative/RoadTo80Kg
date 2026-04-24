import { signIn } from "@/lib/auth/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { redirect } from "next/navigation";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  async function login(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: "/",
      });
    } catch (e) {
      const err = e as Error;
      if (err.message.includes("NEXT_REDIRECT")) throw e;
      redirect("/login?error=1");
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center p-4">
      <div className="topo pointer-events-none fixed inset-0 opacity-80" />
      <div className="relative w-full max-w-sm space-y-6">
        <header className="space-y-1 text-center">
          <p className="text-[11px] uppercase tracking-[0.1em] font-medium text-muted-foreground">
            Caderno de campo
          </p>
          <h1 className="font-display text-3xl font-medium tracking-tight">
            Rumo aos <span className="italic text-primary">80</span> kg
          </h1>
        </header>
        <Card>
          <CardHeader>
            <p className="font-display text-xl font-medium">Entrar</p>
          </CardHeader>
          <CardContent>
            <form action={login} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required autoComplete="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Palavra-passe</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </div>
              <LoginError searchParams={searchParams} />
              <Button type="submit" className="w-full">
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

async function LoginError({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  if (!sp.error) return null;
  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
      Credenciais inválidas.
    </div>
  );
}
