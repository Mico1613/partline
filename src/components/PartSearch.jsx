import { Search, X } from "lucide-react";
import { setNumber, selectBrand } from "../store.js";
import { Loader, ErrorMessage } from "./RequestState.jsx";
export function PartSearch({ search: s, dispatch, retryBrands }) {
  return (
    <section className="search" aria-label="Поиск по артикулу">
      <label htmlFor="article">Артикул запчасти</label>
      <div className="plate">
        <span className="plate-strip" aria-hidden="true">
          <Search size={22} />
        </span>
        <input
          id="article"
          value={s.number}
          maxLength={100}
          onChange={(e) => dispatch(setNumber(e.target.value))}
          placeholder="W 914/2"
          autoComplete="off"
          spellCheck="false"
        />
        {s.number && (
          <button
            className="clear"
            aria-label="Очистить артикул"
            onClick={() => dispatch(setNumber(""))}
          >
            <X size={20} />
          </button>
        )}
        <button
          className="search-button"
          disabled={!s.number.trim() || s.brandsStatus === "loading"}
          onClick={retryBrands}
        >
          Найти
        </button>
      </div>
      {s.brandsStatus === "loading" && <Loader>Ищем производителей…</Loader>}
      {s.brandsStatus === "error" && (
        <ErrorMessage message={s.brandsError} retry={retryBrands} />
      )}
      {s.brandsStatus === "success" &&
        (s.brands.length ? (
          <div className="brands" role="group" aria-label="Производитель">
            <span className="brands-title">Выберите производителя</span>
            <div className="chips">
              {s.brands.map((b) => (
                <button
                  key={b.brand}
                  className={`chip ${s.brand === b.brand ? "active" : ""}`}
                  aria-pressed={s.brand === b.brand}
                  onClick={() =>
                    dispatch(selectBrand(s.brand === b.brand ? null : b.brand))
                  }
                >
                  {b.brand}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="state">
            Производители не найдены. Проверьте артикул или попробуйте другой.
          </div>
        ))}
    </section>
  );
}
