import express from "express";
import { mockResponse } from "../src/mock.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
export function createApp({
  apiKey = process.env.FAVORIT_API_KEY,
  dataMode = process.env.DATA_MODE,
  apiUrl = process.env.FAVORIT_API_URL ||
    "https://api.favorit-parts.ru/hs/hsprice/",
  fetchImpl = fetch,
  timeoutMs = 15000,
} = {}) {
  if (dataMode !== undefined && !["mock", "api"].includes(dataMode)) {
    throw new Error("DATA_MODE должен быть mock или api.");
  }
  const app = express();
  app.disable("x-powered-by");
  app.get("/api/health", (_, res) => res.json({ status: "ok" }));
  app.get("/api/search", async (req, res) => {
    res.set("Cache-Control", "no-store");
    const { number, brand, mode } = req.query;
    if (
      typeof number !== "string" ||
      !number.trim() ||
      number.length > 100 ||
      (brand !== undefined && (typeof brand !== "string" || brand.length > 150))
    )
      return res
        .status(400)
        .json({ error: "Укажите корректный артикул и производителя." });
    if (mode !== undefined && !["mock", "api"].includes(mode))
      return res.status(400).json({ error: "Неизвестный режим поиска." });
    if ((dataMode || mode) === "mock")
      return res.json(mockResponse(number.trim(), brand));
    if (!apiKey)
      return res.status(503).json({
        error:
          "Для подключения укажите FAVORIT_API_KEY в серверном файле .env и перезапустите сервер.",
      });
    try {
      const url = new URL(apiUrl);
      url.search = new URLSearchParams({
        key: apiKey,
        number: number.trim(),
        ...(brand ? { brand, analogues: "on" } : {}),
      }).toString();
      const response = await fetchImpl(url, {
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (response.status >= 500)
        return res.status(502).json({
          error: `Сервис поставщика недоступен (HTTP ${response.status}). Повторите попытку.`,
        });
      let payload;
      try {
        payload = await response.json();
      } catch (error) {
        if (error.name === "TimeoutError") throw error;
        return res.status(502).json({
          error:
            "Сервис поставщика вернул некорректный ответ. Повторите попытку.",
        });
      }
      if (response.status < 500 && payload?.error) {
        const translations = {
          "Empty key!": "Не указан ключ покупателя.",
          "Invalid key client!": "Неверный ключ покупателя.",
          "Empty number goods!": "Не указан артикул детали.",
          "Request quota exceeded!": "Превышен лимит запросов поставщика.",
        };
        const errors = Array.isArray(payload.error)
          ? payload.error
          : [payload.error];
        const message = errors
          .map((error) => translations[String(error)] || String(error))
          .join("; ")
          .split(apiKey)
          .join("[скрыто]");
        return res
          .status(response.ok ? 502 : response.status)
          .json({ error: message });
      }
      if (!response.ok)
        return res.status(502).json({
          error: `Сервис поставщика недоступен (HTTP ${response.status}). Повторите попытку.`,
        });
      res.json(payload);
    } catch (error) {
      res.status(502).json({
        error:
          error.name === "TimeoutError"
            ? "Сервис не ответил за 15 секунд. Повторите попытку."
            : "Не удалось получить ответ от поставщика. Проверьте подключение и повторите попытку.",
      });
    }
  });
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const dist = path.join(root, "dist");
  app.use("/api", (_, res) =>
    res.status(404).json({ error: "API-маршрут не найден." }),
  );
  app.use(express.static(dist));
  app.use("/assets", (_, res) => res.sendStatus(404));
  app.get("/{*path}", (_, res) => res.sendFile("index.html", { root: dist }));
  return app;
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  createApp().listen(process.env.PORT || 3001, () =>
    console.log(`Partline API: http://localhost:${process.env.PORT || 3001}`),
  );
}
