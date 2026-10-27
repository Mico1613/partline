import { useDispatch, useSelector } from "react-redux";
import { setNumber, selectBrand, isDemo } from "../../store.js";
import { Loader, ErrorMessage } from "../RequestState/RequestState.jsx";
export function PartSearch({ retryBrands }) {
  const s = useSelector((state) => state.search);
  const dispatch = useDispatch();
  return (
    <section aria-label="Поиск по артикулу">
      <label htmlFor="article" className="form-label">
        Артикул запчасти
      </label>
      <div className="input-group input-group-lg">
        <input
          id="article"
          className="form-control"
          value={s.number}
          maxLength={100}
          onChange={(e) => dispatch(setNumber(e.target.value))}
          placeholder="W 914/2"
          autoComplete="off"
          spellCheck="false"
        />
        {s.number && (
          <button
            className="btn btn-outline-secondary fs-4 lh-1"
            aria-label="Очистить артикул"
            onClick={() => dispatch(setNumber(""))}
          >
            ×
          </button>
        )}
        <button
          className="btn btn-warning px-4"
          disabled={!s.number.trim() || s.brandsStatus === "loading"}
          onClick={retryBrands}
        >
          Найти
        </button>
      </div>
      {isDemo && (
        <div className="form-text">
          Демо-данные. Попробуйте: W 914/2, 0 451 103 033, OC 384
        </div>
      )}
      {s.brandsStatus === "loading" && <Loader>Ищем производителей…</Loader>}
      {s.brandsStatus === "error" && (
        <ErrorMessage message={s.brandsError} retry={retryBrands} />
      )}
      {s.brandsStatus === "success" &&
        (s.brands.length ? (
          <div className="mt-4" role="group" aria-label="Производитель">
            <div className="small text-white-50 mb-2">
              Выберите производителя
            </div>
            <div className="d-flex flex-wrap gap-2">
              {s.brands.map((brand) => (
                <button
                  key={brand}
                  className={`btn ${s.brand === brand ? "btn-warning" : "btn-outline-light"}`}
                  aria-pressed={s.brand === brand}
                  onClick={() =>
                    dispatch(selectBrand(s.brand === brand ? null : brand))
                  }
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-white-50 mt-3 mb-0">
            Производители не найдены. Проверьте артикул или попробуйте другой.
          </p>
        ))}
    </section>
  );
}
