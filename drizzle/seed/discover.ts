import { discoverSkus } from "../../src/lib/scrape/continente";

async function main() {
  console.log("→ A descobrir SKUs reais em continente.pt (pode demorar ~2 min)…");
  const r = await discoverSkus();
  console.log(`✓ ${r.matched} produtos emparelhados.`);
  if (r.unmatched.length > 0) {
    console.log(`⚠ ${r.unmatched.length} sem match:`);
    for (const u of r.unmatched) console.log(`  - ${u.name}: ${u.reason}`);
  }
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
