import { PartSearch } from "./components/PartSearch.jsx";
import { Offers } from "./components/Offers.jsx";
import { usePartsSearch } from "./hooks/usePartsSearch.js";
export default function App() {
  const { search: s, dispatch, retryBrands, retryOffers } = usePartsSearch();
  return (
    <>
      <div className={`hero ${s.brand ? "compact" : ""}`}>
        <div className="wrap">
          <header className="topbar">
            <a href="./" className="logo">
              <span className="logo-mark" aria-hidden="true" />
              partline
            </a>
          </header>
          <div className="hero-body">
            <h1>Найдите деталь по артикулу</h1>
            <p className="lead">
              Покажем всех производителей, наличие на складах и аналоги с
              ценами.
            </p>
            <PartSearch
              search={s}
              dispatch={dispatch}
              retryBrands={retryBrands}
            />
          </div>
        </div>
      </div>
      <main>
        <Offers search={s} retryOffers={retryOffers} />
      </main>
    </>
  );
}
