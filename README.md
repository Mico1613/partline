# Partline

Поиск автозапчастей и аналогов через API Favorit Parts.

## Запуск

```sh
cp .env.example .env
```

Впишите ключ в `.env`:

```dotenv
VITE_FAVORIT_API_KEY=ваш_ключ
```

Без ключа приложение покажет демо-данные.

```sh
docker compose up --build -d
```

Откройте http://localhost:8080.
