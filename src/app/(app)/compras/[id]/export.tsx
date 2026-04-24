"use client";
import { Button } from "@/components/ui/button";

export default function ExportButton({ text }: { text: string }) {
  async function copy() {
    await navigator.clipboard.writeText(text);
    alert("Copiado.");
  }
  return (
    <Button variant="outline" size="sm" onClick={copy}>Copiar lista</Button>
  );
}
