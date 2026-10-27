import test from "node:test";
import assert from "node:assert/strict";
import { getBrands, getOffers, readGoods } from "../src/data.js";
test("documented empty responses produce no goods", () => {
  assert.deepEqual(readGoods({ goods: [{}] }), []);
  assert.deepEqual(readGoods({ goods: [] }), []);
});
test("API errors and malformed payloads are surfaced", () => {
  assert.throws(
    () => readGoods({ error: "Invalid key client!" }),
    /Invalid key/,
  );
  assert.throws(() => readGoods({ unexpected: [] }), /формате/);
});
test("brands are deduplicated", () => {
  assert.equal(
    getBrands([
      { brand: "A", number: "1" },
      { brand: "A", number: "1" },
    ]).length,
    1,
  );
});
test("warehouse prices are used instead of obsolete product price; nested analogues are flattened", () => {
  const rows = getOffers([
    {
      goodsID: "1",
      brand: "A",
      number: "1",
      price: 99999,
      warehouses: [
        { id: "ms", price: 50, stock: 2 },
        { id: "spb", price: 60, stock: 0 },
      ],
      analogues: [{ brand: "B", number: "2", price: 999, warehouses: [] }],
    },
  ]);
  assert.equal(rows.length, 3);
  assert.deepEqual(
    rows.map((r) => r.price),
    [50, 60, null],
  );
  assert.equal(rows[1].stock, 0);
  assert.equal(rows[2].analogue, true);
});
test("same warehouse offer is deduplicated", () => {
  const part = {
    brand: "A",
    number: "1",
    warehouses: [{ id: "ms", price: 0, stock: 1 }],
  };
  assert.equal(getOffers([part, part]).length, 1);
  assert.equal(getOffers([part])[0].price, 0);
});
