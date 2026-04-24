"use client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Clipboard } from "lucide-react";

export default function ExportButton({ text }: { text: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Lista copiada", { description: "Cola no bloco de notas ou app do Continente." });
    } catch {
      toast.error("Não copiou");
    }
  }
  return (
    <Button variant="outline" size="sm" onClick={copy}>
      <Clipboard className="size-3.5" />
      Copiar lista
    </Button>
  );
}
