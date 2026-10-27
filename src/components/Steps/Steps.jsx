import { useSelector } from "react-redux";
const steps = [
  ["Введите артикул", "Номер детали с упаковки или из каталога."],
  ["Выберите производителя", "Один артикул выпускают разные бренды."],
  ["Сравните предложения", "Цены, остатки на складах и аналоги."],
];
export function Steps() {
  const s = useSelector((state) => state.search);
  const current = s.brandsStatus === "success" && s.brands.length ? 1 : 0;
  return (
    <ol className="list-unstyled row row-cols-1 row-cols-md-3 g-3 mb-0">
      {steps.map(([title, text], i) => (
        <li key={title} className="col">
          <div
            className={`card h-100 ${i === current ? "border-warning" : ""}`}
          >
            <div className="card-body">
              <span
                className={`badge rounded-pill mb-2 ${i === current ? "text-bg-warning border border-warning" : "text-bg-light border"}`}
              >
                Шаг {i + 1}
              </span>
              <div className="fw-semibold">{title}</div>
              <div className="small text-body-secondary">{text}</div>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
