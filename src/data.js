export function readGoods(payload) {
  if (payload?.error)
    throw new Error(
      Array.isArray(payload.error)
        ? payload.error.join("; ")
        : String(payload.error),
    );
  const goods = Array.isArray(payload) ? payload : payload?.goods;
  if (!Array.isArray(goods))
    throw new Error("Сервис вернул ответ в неизвестном формате.");
  return goods.filter((item) => item && item.brand && item.number);
}
export function getBrands(goods) {
  return [
    ...new Map(
      goods.map((g) => [g.brand, { brand: g.brand, number: g.number }]),
    ).values(),
  ];
}
export function getOffers(goods) {
  const rows = new Map();
  function visit(g, analogue = false) {
    if (!g?.brand || !g.number) return;
    const warehouses = Array.isArray(g.warehouses) ? g.warehouses : [];
    const base = {
      brand: g.brand,
      number: g.number,
      name: g.name || "Без наименования",
      analogue,
    };
    const id = g.goodsID || `${g.brand}:${g.number}`;
    if (!warehouses.length)
      rows.set(`${id}:none`, {
        ...base,
        id: `${id}:none`,
        price: null,
        stock: 0,
        warehouse: "Нет предложений",
      });
    warehouses.forEach((w, index) => {
      const key = `${id}:${w.id || w.code || index}`;
      const price = w.price == null || w.price === "" ? null : Number(w.price);
      if (!rows.has(key))
        rows.set(key, {
          ...base,
          id: key,
          price: Number.isFinite(price) ? price : null,
          stock: Math.max(0, Number(w.stock) || 0),
          warehouse: w.code || "Склад поставщика",
        });
    });
    if (Array.isArray(g.analogues)) g.analogues.forEach((a) => visit(a, true));
  }
  goods.forEach((g) => visit(g));
  return [...rows.values()];
}
