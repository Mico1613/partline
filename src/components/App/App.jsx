import { useSelector } from "react-redux";
import { PartSearch } from "../PartSearch/PartSearch.jsx";
import { Offers } from "../Offers/Offers.jsx";
import { Steps } from "../Steps/Steps.jsx";
import { usePartsSearch } from "../../hooks/usePartsSearch.js";
export default function App() {
  const { retryBrands, retryOffers } = usePartsSearch();
  const brand = useSelector((state) => state.search.brand);
  return (
    <>
      <header
        className="bg-dark text-white py-4 py-md-5 mb-4"
        data-bs-theme="dark"
      >
        <div className="container">
          <a
            href="./"
            className="d-inline-block mb-3 fs-4 fw-bold text-warning text-decoration-none"
          >
            partline
          </a>
          <h1 className="display-6 fw-bold">Найдите деталь по артикулу</h1>
          <p className="lead text-white-50 mb-4">
            Покажем всех производителей, наличие на складах и аналоги с ценами.
          </p>
          <PartSearch retryBrands={retryBrands} />
        </div>
      </header>
      <main className="container pb-5">
        {brand ? <Offers retryOffers={retryOffers} /> : <Steps />}
      </main>
    </>
  );
}
