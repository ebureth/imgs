import fs from "node:fs";
import path from "node:path";

function normalizeSlashes(p) {
  return p.split(path.sep).join("/");
}

function isAssetFile(fileName) {
  const lower = fileName.toLowerCase();
  if (lower === "name.txt") return false;
  if (lower === "cdn-links.txt") return false;
  if (lower.endsWith(".txt") || lower.endsWith(".md") || lower.endsWith(".html")) return false;
  return true;
}

function parseExistingListedFiles(cdnLinksText) {
  const lines = cdnLinksText.split(/\r?\n/);
  const listed = new Set();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;
    // We write pairs: filename, then URL. Only collect the filename lines.
    if (!line.startsWith("http://") && !line.startsWith("https://")) {
      listed.add(line);
    }
  }
  return listed;
}

function buildUrl({ owner, repo, ref, relDir, fileName }) {
  const relPath = `${relDir}/${fileName}`.replace(/\/+/g, "/");
  return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${ref}/${relPath}`;
}

function ensureHeader({ owner, repo, ref, relDir }) {
  return [
    `# jsDelivr CDN links — ${relDir}`,
    `# Base: https://cdn.jsdelivr.net/gh/${owner}/${repo}@${ref}/${relDir}/`,
    "",
  ].join("\n");
}

function main() {
  const args = process.argv.slice(2);
  const dirArg = args[0];
  if (!dirArg) {
    console.error("Usage: node tools/update-cdn-links.mjs <dir> [--owner ebureth] [--repo imgs] [--ref main]");
    process.exit(2);
  }

  const owner = (args.includes("--owner") ? args[args.indexOf("--owner") + 1] : null) || "ebureth";
  const repo = (args.includes("--repo") ? args[args.indexOf("--repo") + 1] : null) || "imgs";
  const ref = (args.includes("--ref") ? args[args.indexOf("--ref") + 1] : null) || "main";

  const repoRoot = process.cwd();
  const absDir = path.isAbsolute(dirArg) ? dirArg : path.join(repoRoot, dirArg);
  const relDir = normalizeSlashes(path.relative(repoRoot, absDir));

  if (!fs.existsSync(absDir) || !fs.statSync(absDir).isDirectory()) {
    console.error(`Directory not found: ${absDir}`);
    process.exit(2);
  }

  const cdnLinksPath = path.join(absDir, "cdn-links.txt");
  const existingText = fs.existsSync(cdnLinksPath) ? fs.readFileSync(cdnLinksPath, "utf8") : "";
  const header = ensureHeader({ owner, repo, ref, relDir });
  const existingListed = parseExistingListedFiles(existingText);

  const dirEntries = fs.readdirSync(absDir, { withFileTypes: true });
  const files = dirEntries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter(isAssetFile)
    .sort((a, b) => a.localeCompare(b, "en"));

  const toAppend = files.filter((f) => !existingListed.has(f));
  if (toAppend.length === 0 && fs.existsSync(cdnLinksPath)) {
    console.log(`No changes for ${normalizeSlashes(path.relative(repoRoot, cdnLinksPath))}.`);
    return;
  }

  const appendText = toAppend
    .map((fileName) => `${fileName}\n${buildUrl({ owner, repo, ref, relDir, fileName })}\n`)
    .join("\n");

  let next = existingText.trimEnd();
  if (!next) {
    next = header.trimEnd();
  }

  if (appendText) {
    next = `${next}\n\n${appendText}`.replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
  } else {
    next = next + "\n";
  }

  fs.writeFileSync(cdnLinksPath, next, "utf8");
  console.log(`Updated ${normalizeSlashes(path.relative(repoRoot, cdnLinksPath))}: appended ${toAppend.length} link(s).`);
}

main();

