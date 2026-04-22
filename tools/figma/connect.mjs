import fs from "node:fs";
import path from "node:path";

function usage() {
  console.log(
    [
      "Figma connect check (no downloads).",
      "",
      "Usage:",
      "  node tools/figma/connect.mjs",
      "  node tools/figma/connect.mjs --file <FIGMA_FILE_KEY>",
      "  node tools/figma/connect.mjs --config tools/figma/config.json",
      "",
      "Env:",
      "  FIGMA_TOKEN        (required) Personal Access Token",
      "  FIGMA_FILE_KEY     (optional) Figma file key",
    ].join("\n"),
  );
}

function getArgValue(args, name) {
  const idx = args.indexOf(name);
  if (idx === -1) return null;
  return args[idx + 1] ?? null;
}

async function figmaFetch(token, apiPath) {
  const res = await fetch(`https://api.figma.com/v1/${apiPath}`, {
    headers: {
      "X-Figma-Token": token,
    },
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

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    usage();
    process.exit(0);
  }

  const token = process.env.FIGMA_TOKEN;
  if (!token) {
    console.error("Missing FIGMA_TOKEN env var.");
    usage();
    process.exit(2);
  }

  const configPathArg = getArgValue(args, "--config");
  let config = {};
  if (configPathArg) {
    const abs = path.isAbsolute(configPathArg)
      ? configPathArg
      : path.join(process.cwd(), configPathArg);
    if (!fs.existsSync(abs)) {
      console.error(`Config not found: ${abs}`);
      process.exit(2);
    }
    config = JSON.parse(fs.readFileSync(abs, "utf8"));
  }

  const fileKeyArg = getArgValue(args, "--file");
  const fileKey = fileKeyArg || process.env.FIGMA_FILE_KEY || config.fileKey || null;

  const me = await figmaFetch(token, "me");
  console.log(`OK: token works as "${me?.email ?? me?.handle ?? me?.id ?? "unknown"}"`);

  if (fileKey) {
    const file = await figmaFetch(token, `files/${encodeURIComponent(fileKey)}?depth=1`);
    console.log(`OK: file access "${file?.name ?? "unknown"}" (${fileKey})`);
  } else {
    console.log("Note: no file key provided; set FIGMA_FILE_KEY or pass --file to check a конкретный файл.");
  }
}

main().catch((err) => {
  console.error("FAILED:", err?.message ?? String(err));
  process.exit(1);
});

