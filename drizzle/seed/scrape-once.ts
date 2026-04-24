import { scrapeAll } from "../../src/lib/scrape/continente";

async function main() {
  console.log("→ A puxar preços actuais do continente.pt…");
  const r = await scrapeAll();
  console.log(`✓ ${r.ok} preços actualizados.`);
  if (r.errors.length > 0) {
    console.log(`⚠ ${r.errors.length} falhas:`);
    for (const e of r.errors) console.log(`  - ${e.sku}: ${e.reason}`);
  }
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
