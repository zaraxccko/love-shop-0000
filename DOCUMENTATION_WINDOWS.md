# LoveShop — Деплой на Windows Server 2022 (Docker + Caddy)

> Инструкция для VPS на **Windows Server 2022** с **Docker Desktop** и **Caddy** в роли
> reverse-proxy (HTTPS получается автоматически через Let's Encrypt).
>
> **Код проекта менять не надо** — Docker запускает тот же Linux-контейнер, что и на
> Ubuntu. Различаются только команды снаружи (PowerShell) и пути (`C:\loveshop\...`).
>
> Полная техническая документация (архитектура, API, БД, бот) — в `DOCUMENTATION.md`.

---

## 📋 Что понадобится

- Windows Server 2022 (или Windows 10/11 Pro) с правами администратора
- Минимум 2 GB RAM, 20 GB диска
- Открытые порты **80** и **443** (Inbound rules в Windows Firewall)
- Домен с A-записью на IP сервера
- Telegram-бот ([@BotFather](https://t.me/BotFather)) + твой Telegram ID ([@userinfobot](https://t.me/userinfobot))

---

## 🚀 Деплой за 6 шагов

### Шаг 1. Поставить Docker Desktop

1. Скачай: https://www.docker.com/products/docker-desktop/
2. Установи (нужен **WSL 2** — установщик предложит включить, согласись).
3. Перезагрузи сервер.
4. Запусти Docker Desktop, дождись зелёной иконки в трее.
5. Проверь в PowerShell:
   ```powershell
   docker --version
   docker compose version
   ```

### Шаг 2. Поставить Node.js (нужен только для сборки фронта)

Скачай LTS: https://nodejs.org/ → установи.

```powershell
node --version    # должен быть 20+
npm --version
```

### Шаг 3. Поставить Caddy

Caddy = reverse-proxy + автоматический Let's Encrypt в одном бинаре.

**Вариант A — через Chocolatey (рекомендую):**
```powershell
# Поставить Chocolatey один раз:
Set-ExecutionPolicy Bypass -Scope Process -Force
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Поставить Caddy:
choco install caddy -y
```

**Вариант B — вручную:**
1. Скачай `caddy_windows_amd64.zip` с https://caddyserver.com/download
2. Распакуй в `C:\caddy\`
3. Добавь `C:\caddy` в PATH (Системные переменные → Path → Edit → New).

Проверь:
```powershell
caddy version
```

### Шаг 4. Склонировать проект

```powershell
# Поставить Git если нет: choco install git -y
git clone <твой-репо> C:\loveshop
cd C:\loveshop
```

### Шаг 5. Поднять backend (Docker)

```powershell
cd C:\loveshop\backend
copy .env.example .env
notepad .env
```

Заполни `.env` (см. таблицу ниже), сохрани.

| Переменная | Значение |
|---|---|
| `DATABASE_URL` | оставь как есть |
| `JWT_SECRET` | сгенерируй: `[Convert]::ToHexString((New-Object byte[] 32 \| % { (Get-Random -Max 256) }))` или просто 64 случайных символа |
| `TELEGRAM_BOT_TOKEN` | от @BotFather |
| `ADMIN_TG_IDS` | твой Telegram ID |
| `WEBAPP_URL` | `https://твой-домен.com` |
| `CORS_ORIGIN` | `https://твой-домен.com` |
| `PUBLIC_UPLOAD_URL` | `https://твой-домен.com/uploads` |

Подними:
```powershell
docker compose up -d --build
docker compose logs -f api    # увидишь "API listening on :3000"
# Ctrl+C чтобы выйти из логов (контейнер продолжит работать)
```

### Шаг 6. Собрать frontend

```powershell
cd C:\loveshop
"VITE_API_URL=https://твой-домен.com/api" | Out-File -Encoding ascii .env
npm ci
npm run build
```

Готовая статика лежит в `C:\loveshop\dist\`.

### Шаг 7. Настроить Caddy (reverse-proxy + автоматический HTTPS)

Создай файл `C:\caddy\Caddyfile` (без расширения):

```caddy
твой-домен.com {
    # Frontend (статика Vite)
    root * C:\loveshop\dist
    encode gzip
    file_server
    try_files {path} /index.html

    # API → Docker контейнер
    handle /api/* {
        reverse_proxy localhost:3000
    }

    # Загрузки (фото подтверждений) → тот же контейнер
    handle /uploads/* {
        reverse_proxy localhost:3000
    }

    # Логи
    log {
        output file C:\caddy\logs\access.log
    }
}
```

Замени `твой-домен.com` на реальный.

Запусти Caddy как службу Windows (чтобы стартовал автоматически):

```powershell
# Запуск службой (Caddy сам зарегистрируется)
cd C:\caddy
caddy run --config Caddyfile
```

Caddy сразу:
- получит SSL-сертификат от Let's Encrypt (нужен открытый 80/443 порт),
- начнёт раздавать фронт по HTTPS,
- проксировать `/api/*` и `/uploads/*` в Docker.

**Чтобы сделать его службой Windows** (автозапуск при перезагрузке):

```powershell
# Скачай и распакуй WinSW (Windows Service Wrapper):
# https://github.com/winsw/winsw/releases/latest → WinSW-x64.exe

# Положи в C:\caddy\caddy-service.exe (переименуй WinSW-x64.exe)
# Создай рядом C:\caddy\caddy-service.xml:
```

Содержимое `C:\caddy\caddy-service.xml`:
```xml
<service>
  <id>caddy</id>
  <name>Caddy Web Server</name>
  <description>Caddy reverse proxy with auto HTTPS</description>
  <executable>C:\caddy\caddy.exe</executable>
  <arguments>run --config C:\caddy\Caddyfile</arguments>
  <log mode="roll-by-size">
    <sizeThreshold>10240</sizeThreshold>
    <keepFiles>5</keepFiles>
  </log>
</service>
```

Установи и запусти службу:
```powershell
C:\caddy\caddy-service.exe install
C:\caddy\caddy-service.exe start
```

### Шаг 8. Открыть порты в Firewall

```powershell
New-NetFirewallRule -DisplayName "HTTP"  -Direction Inbound -LocalPort 80  -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow
```

### Шаг 9. Привязать WebApp в Telegram

В @BotFather: `/mybots → твой бот → Bot Settings → Menu Button → Configure menu button`
→ вставь `https://твой-домен.com`.

### Готово! 🎉

Открывай бота в Telegram, жми «🛒 Магазин» — приложение работает.

---

## 🔄 Обновление кода

```powershell
cd C:\loveshop
git pull

# Пересобрать backend
cd backend
docker compose up -d --build

# Пересобрать frontend
cd ..
npm ci
npm run build
```

Caddy подхватит новый `dist/` сразу, перезапуск не нужен.

---

## 💾 Бэкап БД (Task Scheduler)

Создай `C:\loveshop\backup.ps1`:
```powershell
$date = Get-Date -Format "yyyy-MM-dd"
$backupDir = "C:\backups"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

docker exec backend-postgres-1 pg_dump -U appuser shopdb | Out-File -Encoding utf8 "$backupDir\shop_$date.sql"

# Удалить бэкапы старше 30 дней
Get-ChildItem "$backupDir\*.sql" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item
```

Запланируй ежедневно в 03:00:
```powershell
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-File C:\loveshop\backup.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 3am
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "LoveShop Backup" -RunLevel Highest
```

---

## 📊 Полезные команды (PowerShell)

| Что | Команда |
|---|---|
| Логи API | `cd C:\loveshop\backend; docker compose logs -f api` |
| Перезапуск API | `cd C:\loveshop\backend; docker compose restart api` |
| Открыть psql | `cd C:\loveshop\backend; docker compose exec postgres psql -U appuser -d shopdb` |
| Логи Caddy | `Get-Content C:\caddy\logs\access.log -Tail 50 -Wait` |
| Перезапуск Caddy | `Restart-Service caddy` |
| Состояние Docker | `docker compose ps` |
| Применить миграции вручную | `docker compose exec api npx prisma migrate deploy` |

---

## 🐛 Траблшутинг (Windows-специфичный)

| Симптом | Решение |
|---|---|
| **Docker Desktop не стартует** | Включи Hyper-V и WSL 2 в Windows Features. Перезагрузись. |
| **`docker compose` не находится** | Перезайди в PowerShell после установки Docker Desktop, проверь `docker compose version`. |
| **Caddy не получает SSL** | Проверь, что 80/443 открыты в Firewall и проброшены провайдером VPS. DNS A-запись должна указывать на IP. |
| **`port 80 already in use`** | На Windows Server 80-й порт может занимать IIS. Останови: `Stop-Service W3SVC; Set-Service W3SVC -StartupType Disabled`. |
| **`docker compose` команды зависают** | Перезапусти Docker Desktop, проверь, что WSL 2 работает: `wsl --status`. |
| **Контейнер падает с `permission denied` на uploads** | В Docker Desktop → Settings → Resources → File Sharing → добавь `C:\loveshop`. |
| **Изменения в `.env` не применяются** | `docker compose down; docker compose up -d --build` (полный рестарт). |
| **Caddy служба не стартует** | Проверь логи: `Get-EventLog -LogName Application -Source caddy -Newest 20`. |

---

## 🔒 Безопасность Windows-сервера

- Включи автообновления Windows: `sconfig` → пункт 5.
- Поставь антивирус (Windows Defender по умолчанию ок).
- Закрой RDP от внешнего мира — только VPN или Cloudflare Tunnel.
- Используй сильный пароль администратора.
- Регулярно обновляй Docker Desktop (он сам предлагает).

---

## ❓ FAQ

**Q: Точно код не надо адаптировать?**
A: Точно. Docker запускает Linux-контейнер с Node.js + Postgres. Внутри контейнера всё как на Ubuntu. Хост-ОС (Windows) только держит контейнеры через WSL 2.

**Q: Caddy реально проще nginx?**
A: Да. SSL-сертификат от Let's Encrypt получается автоматически — никакого certbot, никаких cron-задач на обновление. Конфиг в 5 строк вместо 30.

**Q: Можно без Docker, поставить Node.js и Postgres напрямую на Windows?**
A: Можно, но геморройнее: придётся отдельно ставить PostgreSQL для Windows, настраивать service, прописывать `DATABASE_URL` под `localhost`. Docker делает всё одной командой и переносится 1-в-1 на любой другой сервер.

**Q: А Linux-сервер был бы дешевле?**
A: Обычно да — Linux-VPS у большинства провайдеров стоит на 30-50% меньше. Если ты не привязан к Windows, рассмотри переход на Ubuntu (см. `DOCUMENTATION.md`).

---

_Версия документа: 2026-04-22._
