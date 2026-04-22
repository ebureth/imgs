## Email assets automation

### Update `cdn-links.txt` for one folder

From repo root:

```bash
node tools/update-cdn-links.mjs email/pictures/buttons
```

This **appends missing links** (does not rewrite existing lines), using jsDelivr format:
`https://cdn.jsdelivr.net/gh/ebureth/imgs@main/<path>`

### Update all `email/pictures/**` folders

```bash
node tools/update-all-cdn-links.mjs
```

### Change repo/ref (optional)

```bash
node tools/update-all-cdn-links.mjs --owner ebureth --repo imgs --ref main
```

## Figma

- **Connect check (no downloads)**: see `tools/figma/README.md`

