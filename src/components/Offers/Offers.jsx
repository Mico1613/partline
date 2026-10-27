import { Fragment, useState } from "react";
import { useSelector } from "react-redux";
import { Loader, ErrorMessage } from "../RequestState/RequestState.jsx";
import "./Offers.css";
const money = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 2,
});
const sorts = [
  ["default", "Искомая"],
  ["price", "Дешевле"],
  ["stock", "Больше остаток"],
];
export function Offers({ retryOffers }) {
  const s = useSelector((state) => state.search);
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
  const ready = s.offersStatus === "success";
  return (
    <section className="card shadow-sm" aria-labelledby="offers-title">
      <div className="card-header bg-body d-flex flex-wrap justify-content-between align-items-center gap-3 py-3">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h2 id="offers-title" className="h5 mb-0">
              Предложения и аналоги
            </h2>
            {ready && (
              <span className="badge rounded-pill text-bg-secondary count-badge">
                {rows.length}
              </span>
            )}
          </div>
          <div className="small text-body-secondary text-break">
            {s.brand} / {s.number}
          </div>
        </div>
        {ready && s.offers.length > 0 && (
          <div className="d-flex flex-wrap align-items-center gap-3">
            <input
              id="in-stock"
              type="checkbox"
              className="btn-check"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
            />
            <label
              className="btn btn-sm btn-outline-success"
              htmlFor="in-stock"
            >
              Только в наличии
            </label>
            <div
              className="btn-group btn-group-sm"
              role="group"
              aria-label="Сортировка"
            >
              {sorts.map(([value, label]) => (
                <Fragment key={value}>
                  <input
                    id={`sort-${value}`}
                    type="radio"
                    name="sort"
                    className="btn-check"
                    checked={sort === value}
                    onChange={() => setSort(value)}
                  />
                  <label
                    className="btn btn-outline-secondary"
                    htmlFor={`sort-${value}`}
                  >
                    {label}
                  </label>
                </Fragment>
              ))}
            </div>
          </div>
        )}
      </div>
      {s.offersStatus === "loading" && (
        <div className="card-body">
          <Loader>Загружаем предложения и аналоги…</Loader>
        </div>
      )}
      {s.offersStatus === "error" && (
        <div className="card-body">
          <ErrorMessage message={s.offersError} retry={retryOffers} />
        </div>
      )}
      {ready &&
        (rows.length ? (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 offers-table">
              <thead className="table-light">
                <tr>
                  <th>Деталь / Производитель</th>
                  <th className="d-none d-md-table-cell">Артикул</th>
                  <th className="d-none d-md-table-cell">Склад</th>
                  <th>Остаток</th>
                  <th className="text-end">Цена</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className={r.analogue ? "" : "table-warning"}>
                    <td>
                      <span className="fw-semibold">{r.brand}</span>{" "}
                      <span
                        className={`badge ${r.analogue ? "text-bg-light border" : "text-bg-warning"}`}
                      >
                        {r.analogue ? "Аналог" : "Искомая деталь"}
                      </span>
                      <div className="small text-body-secondary">{r.name}</div>
                      <div className="small text-body-secondary d-md-none">
                        {r.number} · {r.warehouse}
                      </div>
                    </td>
                    <td className="d-none d-md-table-cell text-break">
                      {r.number}
                    </td>
                    <td className="d-none d-md-table-cell text-body-secondary">
                      {r.warehouse}
                    </td>
                    <td
                      className={
                        r.stock ? "text-success" : "text-body-secondary"
                      }
                    >
                      {r.stock ? `${r.stock} шт.` : "Нет в наличии"}
                    </td>
                    <td className="text-end text-nowrap fw-semibold">
                      {r.price === null ? "Не указана" : money.format(r.price)}
                      {r.stock > 0 && r.price === best && (
                        <div className="small text-success fw-normal">
                          Лучшая цена
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card-body text-body-secondary">
            {s.offers.length
              ? "Нет предложений в наличии. Отключите фильтр, чтобы увидеть все позиции."
              : "Предложений и аналогов не найдено. Выберите другого производителя."}
          </div>
        ))}
    </section>
  );
}
