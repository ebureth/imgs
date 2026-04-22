import fs from "node:fs";
import path from "node:path";

function usage() {
  console.log(
    [
      "Figma export (downloads PNG/JPG/SVG/PDF via REST API).",
      "",
      "Usage:",
      "  node tools/figma/export.mjs --config tools/figma/export.json",
      "",
      "Notes:",
      "  - Token should be provided via FIGMA_TOKEN env var or config.token.",
      "  - This script finds nodes by name (exact match) and exports them.",
    ].join("\n"),
  );
}

function getArgValue(args, name) {
  const idx = args.indexOf(name);
  if (idx === -1) return null;
  return args[idx + 1] ?? null;
}

function normalizeSlashes(p) {
  return p.split(path.sep).join("/");
}

function ensureDir(absDir) {
  fs.mkdirSync(absDir, { recursive: true });
}

async function figmaFetchJson(token, apiPath) {
  const res = await fetch(`https://api.figma.com/v1/${apiPath}`, {
    headers: { "X-Figma-Token": token },
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!res.ok) {
    const message = json?.err ?? json?.message ?? text ?? `HTTP ${res.status}`;
    throw new Error(`${res.status} ${res.statusText}: ${message}`);
  }
  return json;
}

async function downloadToFile(url, outPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${res.status} ${res.statusText}: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buf);
}

function* walk(node) {
  if (!node || typeof node !== "object") return;
  yield node;
  const children = node.children;
  if (Array.isArray(children)) {
    for (const c of children) yield* walk(c);
  }
}

function findNodeIdsByExactName(documentRoot, names) {
  const wanted = new Set(names);
  const found = new Map(); // name -> array of ids

  for (const n of walk(documentRoot)) {
    if (!n?.name || !n?.id) continue;
    if (!wanted.has(n.name)) continue;
    if (!found.has(n.name)) found.set(n.name, []);
    found.get(n.name).push(n.id);
  }
  return found;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    usage();
    process.exit(0);
  }

  const configPath = getArgValue(args, "--config");
  if (!configPath) {
    console.error("Missing --config.");
    usage();
    process.exit(2);
  }

  const absConfig = path.isAbsolute(configPath) ? configPath : path.join(process.cwd(), configPath);
  if (!fs.existsSync(absConfig)) {
    console.error(`Config not found: ${absConfig}`);
    process.exit(2);
  }

  const cfg = JSON.parse(fs.readFileSync(absConfig, "utf8"));
  const token = process.env.FIGMA_TOKEN || cfg.token || null;
  const fileKey = cfg.fileKey;
  const outDir = cfg.outDir;
  const format = (cfg.format || "png").toLowerCase();
  const scale = typeof cfg.scale === "number" ? cfg.scale : 1;
  const depth = typeof cfg.searchDepth === "number" ? cfg.searchDepth : 10;
  const assets = Array.isArray(cfg.assets) ? cfg.assets : [];

  if (!token) throw new Error("Missing token. Set FIGMA_TOKEN or put token into config (gitignored).");
  if (!fileKey) throw new Error("Missing config.fileKey");
  if (!outDir) throw new Error("Missing config.outDir");
  if (!["png", "jpg", "svg", "pdf"].includes(format)) throw new Error(`Unsupported format: ${format}`);
  if (scale < 0.01 || scale > 4) throw new Error("scale must be between 0.01 and 4");
  if (assets.length === 0) throw new Error("No assets in config.assets");

  const repoRoot = process.cwd();
  const absOutDir = path.isAbsolute(outDir) ? outDir : path.join(repoRoot, outDir);
  ensureDir(absOutDir);

  const names = assets.map((a) => a.name);
  const file = await figmaFetchJson(token, `files/${encodeURIComponent(fileKey)}?depth=${depth}`);
  const doc = file?.document;
  if (!doc) throw new Error("Unexpected response: no document");

  const found = findNodeIdsByExactName(doc, names);
  for (const name of names) {
    if (!found.has(name)) {
      throw new Error(`Node not found by exact name: "${name}". Tip: use exact layer name in Figma.`);
    }
    const ids = found.get(name);
    if (ids.length !== 1) {
      throw new Error(`Ambiguous name "${name}": found ${ids.length} nodes. Rename one or export by nodeId.`);
    }
  }

  const idByName = new Map(names.map((n) => [n, found.get(n)[0]]));
  const idsParam = names.map((n) => idByName.get(n)).join(",");
  const images = await figmaFetchJson(
    token,
    `images/${encodeURIComponent(fileKey)}?ids=${encodeURIComponent(idsParam)}&format=${encodeURIComponent(format)}&scale=${encodeURIComponent(
      String(scale),
    )}`,
  );

  const urlById = images?.images || {};
  for (const a of assets) {
    const id = idByName.get(a.name);
    const url = urlById[id];
    if (!url) throw new Error(`No export URL for "${a.name}" (${id}).`);
    const outFile = a.outFile || `${a.name}.${format}`;
    const outPath = path.join(absOutDir, outFile);
    await downloadToFile(url, outPath);
    console.log(`Saved ${normalizeSlashes(path.relative(repoRoot, outPath))}`);
  }
}

main().catch((err) => {
  console.error("FAILED:", err?.message ?? String(err));
  process.exit(1);
});

