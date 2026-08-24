# imgs — для Claude

Репо ассетов email-рассылок eburet: вёрстка писем (`email/html/**`) и картинки к ним (`email/pictures/**`), плюс инструменты в `tools/` (см. [`tools/README.md`](./tools/README.md), Figma-экспорт — `tools/figma/`, локальные конфиги в `.gitignore`). Кода сервиса тут нет.

**Картинки раздаются jsDelivr из GitHub-зеркала:** `https://cdn.jsdelivr.net/gh/ebureth/imgs@main/<path>`. Значит зеркало здесь не только DR — пока push-mirror из Forgejo не доехал, новый файл по CDN-ссылке не отдаётся. Список ссылок держится в `cdn-links.txt` каждой папки и **дописывается, а не переписывается**: `node tools/update-cdn-links.mjs email/pictures/buttons` для одной папки, `node tools/update-all-cdn-links.mjs` для всех `email/pictures/**` (репо/реф меняются флагами `--owner ebureth --repo imgs --ref main`).

## Деплой и логи

**Git-источник:** Forgejo `git.eburet.tech/eburet/imgs` (source of truth); GitHub `ebureth/imgs` — зеркало, из которого читает CDN. Локальный `origin` → Forgejo (HTTPS), remote `github` → зеркало.

**Деплой и логи как таковые отсутствуют:** репо не сервис во флоте, контейнера и Dokploy-проекта у него нет. Публикация = пуш в Forgejo + доезд зеркала; проверять ссылкой на jsDelivr, а не логами. Общая инфраструктура — репо `vps` (`vps/infra/DOKPLOY-API.md`, `vps/SERVICE.md`, `vps/infra/LOGS.md`).
