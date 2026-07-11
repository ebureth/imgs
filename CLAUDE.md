# imgs — CLAUDE.md

<!-- BEGIN deploy-logs:forgejo -->
<!-- Автогенерация: Forgejo-миграция. Правьте текст выше/ниже маркеров; блок между маркерами перезаписывается. -->

## Деплой и логи

**Git-источник:** Forgejo — `git.eburet.tech/eburet/imgs` (source of truth).
GitHub `ebureth/imgs` — DR-зеркало (read-only). Локальный `origin` → Forgejo (HTTPS), remote `github` → зеркало.

**Деплой:** этот репозиторий **не является отдельным Dokploy-сервисом** во флоте. Порядок выкатки —
см. `DEPLOY.md` / `deploy.sh` / `docker-compose*.yml` в этом репозитории (если есть).
Общая инфраструктура — `vps` (`vps/infra/DOKPLOY-API.md`, `vps/SERVICE.md`, `vps/infra/LOGS.md`).

**Как смотреть логи** — стандарт **Loki/Grafana** (см. [`vps/infra/LOGS.md`](https://git.eburet.tech/eburet/vps_proxy/src/branch/master/infra/LOGS.md)):
<https://logs.eburet.tech> → Explore → Loki → `{project="<appName>"}` (appName сервиса смотри в `docker ps` на хосте).
Запасной вариант — `ssh root@45.11.93.27` + `docker logs -f --tail=200 <container>`.

<!-- END deploy-logs:forgejo -->
