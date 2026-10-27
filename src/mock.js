const parts = [
  {
    goodsID: "mock-mann",
    brand: "MANN-FILTER",
    number: "W 914/2",
    name: "Фильтр масляный",
    warehouses: [
      { id: "mock-1", code: "Тестовый склад 1", price: 749, stock: 24 },
      { id: "mock-2", code: "Тестовый склад 2", price: 780, stock: 0 },
    ],
  },
  {
    goodsID: "mock-bosch",
    brand: "BOSCH",
    number: "0 451 103 033",
    name: "Фильтр масляный двигателя",
    warehouses: [
      { id: "mock-1", code: "Тестовый склад 1", price: 620, stock: 12 },
    ],
  },
  {
    goodsID: "mock-mahle",
    brand: "MAHLE",
    number: "OC 384",
    name: "Масляный фильтр",
    warehouses: [
      { id: "mock-2", code: "Тестовый склад 2", price: 895, stock: 8 },
    ],
  },
];
const normalize = (number) => number.replace(/[\s/-]/g, "").toUpperCase();
export function mockResponse(number, brand) {
  const normalized = normalize(number);
  const catalog = [
    ...parts,
    { ...parts[1], goodsID: "mock-bosch-example", number: "W 914/2" },
  ];
  const matches = catalog.filter(
    (part) =>
      normalize(part.number) === normalized && (!brand || part.brand === brand),
  );
  return {
    goods: matches.map((part) => ({
      ...part,
      ...(brand
        ? { analogues: parts.filter((other) => other.brand !== part.brand) }
        : {}),
    })),
  };
}
