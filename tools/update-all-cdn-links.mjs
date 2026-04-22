import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function normalizeSlashes(p) {
  return p.split(path.sep).join("/");
}

function listDirsRecursively(startDirAbs) {
  const out = [];
  const stack = [startDirAbs];
  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const abs = path.join(current, e.name);
      out.push(abs);
      stack.push(abs);
    }
  }
  return out;
}

function main() {
  const args = process.argv.slice(2);
  const repoRoot = process.cwd();

  const owner = (args.includes("--owner") ? args[args.indexOf("--owner") + 1] : null) || "ebureth";
  const repo = (args.includes("--repo") ? args[args.indexOf("--repo") + 1] : null) || "imgs";
  const ref = (args.includes("--ref") ? args[args.indexOf("--ref") + 1] : null) || "main";

  const baseDir = path.join(repoRoot, "email", "pictures");
  if (!fs.existsSync(baseDir) || !fs.statSync(baseDir).isDirectory()) {
    console.error(`Not found: ${normalizeSlashes(path.relative(repoRoot, baseDir))}`);
    process.exit(2);
  }

  const dirs = [baseDir, ...listDirsRecursively(baseDir)];
  const tool = path.join(repoRoot, "tools", "update-cdn-links.mjs");

  let updated = 0;
  for (const d of dirs) {
    // Only update folders that contain at least one asset file
    const entries = fs.readdirSync(d, { withFileTypes: true });
    const hasAnyFile = entries.some((e) => e.isFile() && e.name !== "name.txt");
    if (!hasAnyFile) continue;

    const rel = normalizeSlashes(path.relative(repoRoot, d));
    const r = spawnSync(process.execPath, [tool, rel, "--owner", owner, "--repo", repo, "--ref", ref], {
      stdio: "inherit",
    });
    if (r.status !== 0) process.exit(r.status ?? 1);
    updated++;
  }

  console.log(`Done. Processed ${updated} folder(s).`);
}

main();

