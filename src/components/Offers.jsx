import { useState } from "react";
import { Loader, ErrorMessage } from "./RequestState.jsx";
const money = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 2,
});
export function Offers({ search: s, retryOffers }) {
  const [available, setAvailable] = useState(false);
  const [sort, setSort] = useState("default");
  const rows = s.offers
    .filter((r) => !available || r.stock > 0)
    .sort((a, b) =>
      sort === "price"
        ? (a.price ?? Infinity) - (b.price ?? Infinity)
        : sort === "stock"
          ? b.stock - a.stock
          : Number(a.analogue) - Number(b.analogue),
    );
  const best = Math.min(
    ...rows.filter((r) => r.stock > 0 && r.price !== null).map((r) => r.price),
  );
  if (!s.brand) return null;
  return (
    <section className="results wrap">
      <div className="section-title">
        <h2>Предложения и аналоги</h2>
        {s.offersStatus === "success" && (
          <span className="count-badge">{rows.length}</span>
        )}
      </div>
      {s.offersStatus === "loading" && (
        <Loader>Загружаем предложения и аналоги…</Loader>
      )}
      {s.offersStatus === "error" && (
        <ErrorMessage message={s.offersError} retry={retryOffers} />
      )}
      {s.offersStatus === "success" && (
        <>
          <div className="results-toolbar">
            <span className="picked">
              <strong>{s.brand}</strong>
              <span className="divider">/</span>
              {s.number}
            </span>
            <div>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={available}
                  onChange={(e) => setAvailable(e.target.checked)}
                />{" "}
                Только в наличии
              </label>
              <label className="sort">
                <select
                  aria-label="Сортировать предложения"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="default">Сначала искомая деталь</option>
                  <option value="price">Сначала дешевле</option>
                  <option value="stock">По остатку</option>
                </select>
              </label>
            </div>
          </div>
          {rows.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Деталь / Производитель</th>
                    <th>Артикул</th>
                    <th>Склад</th>
                    <th>Остаток</th>
                    <th className="price">Цена</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className={r.analogue ? "" : "original-row"}>
                      <td>
                        <strong>{r.brand}</strong>
                        <span className={`tag ${r.analogue ? "" : "original"}`}>
                          {r.analogue ? "Аналог" : "Искомая деталь"}
                        </span>
                        <small>{r.name}</small>
                      </td>
                      <td className="article-value">{r.number}</td>
                      <td className="warehouse-value">{r.warehouse}</td>
                      <td className="stock-value">
                        <span className={`stock ${r.stock ? "" : "zero"}`}>
                          <i />
                          {r.stock ? `${r.stock} шт.` : "Нет в наличии"}
                        </span>
                      </td>
                      <td className="price price-value">
                        {r.price === null
                          ? "Не указана"
                          : money.format(r.price)}
                        {r.stock > 0 && r.price === best && (
                          <span className="best">Лучшая цена</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="state">
              {s.offers.length
                ? "Нет предложений в наличии. Отключите фильтр, чтобы увидеть все позиции."
                : "Предложений и аналогов не найдено. Выберите другого производителя."}
            </div>
          )}
        </>
      )}
    </section>
  );
}
