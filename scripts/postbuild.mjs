import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = join(process.cwd(), "out");
if (!existsSync(outDir)) {
  console.error("postbuild: out/ directory not found");
  process.exit(1);
}
writeFileSync(join(outDir, ".nojekyll"), "");
console.log("postbuild: wrote out/.nojekyll");
