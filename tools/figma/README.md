## Figma connection (safe check)

This does **not** download any assets. It only checks that:
- your token is valid (`/v1/me`)
- (optionally) you have access to a конкретный Figma file (`/v1/files/:key`)

### 1) Create a Figma token

In Figma: **Settings → Personal access tokens** → create token.

### 2) Run the connection check

PowerShell:

```powershell
$env:FIGMA_TOKEN="PASTE_TOKEN"
node tools/figma/connect.mjs
```

Git Bash:

```bash
export FIGMA_TOKEN="PASTE_TOKEN"
node tools/figma/connect.mjs
```

### 3) (Optional) Check access to a file

If your file URL is like:
`https://www.figma.com/file/FILE_KEY/Some-Name?...`
then `FILE_KEY` is what we need.

PowerShell:

```powershell
$env:FIGMA_TOKEN="PASTE_TOKEN"
node tools/figma/connect.mjs --file "FILE_KEY"
```

### Config file (optional)

Copy example and edit:

```bash
cp tools/figma/config.example.json tools/figma/config.json
```

Then run:

```bash
export FIGMA_TOKEN="PASTE_TOKEN"
node tools/figma/connect.mjs --config tools/figma/config.json
```

Do **not** commit `tools/figma/config.json` if it contains private info.

