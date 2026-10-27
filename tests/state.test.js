import test from "node:test";
import assert from "node:assert/strict";
import {
  searchReducer,
  setNumber,
  selectBrand,
  findBrands,
  findOffers,
} from "../src/store.js";
import { createSearchRunner } from "../src/searchRunner.js";
import { configureStore } from "@reduxjs/toolkit";
test("manual search cancels debounce and changing input aborts request", () => {
  let scheduled;
  let calls = 0;
  let aborts = 0;
  const runner = createSearchRunner(
    () => {
      calls++;
      return {
        abort() {
          aborts++;
        },
      };
    },
    {
      setTimeout(fn) {
        scheduled = fn;
      },
      clearTimeout() {
        scheduled = null;
      },
    },
  );
  runner.schedule("1");
  runner.run("1");
  assert.equal(scheduled, null);
  assert.equal(calls, 1);
  runner.schedule("2");
  assert.equal(aborts, 1);
  scheduled();
  assert.equal(calls, 2);
  runner.cancel();
  assert.equal(aborts, 2);
});
test("new brand search clears selection and rejects stale offer/brand responses", () => {
  let state = searchReducer(undefined, setNumber("1"));
  state = searchReducer(state, selectBrand("A"));
  state = searchReducer(state, findOffers.pending("old-offer", {}));
  state = searchReducer(state, findBrands.pending("new", {}));
  state = searchReducer(
    state,
    findOffers.fulfilled([{ price: 1 }], "old-offer", {}),
  );
  state = searchReducer(
    state,
    findBrands.fulfilled([{ brand: "old" }], "old", {}),
  );
  assert.equal(state.brand, null);
  assert.deepEqual(state.offers, []);
  assert.deepEqual(state.brands, []);
  state = searchReducer(
    state,
    findBrands.fulfilled([{ brand: "new" }], "new", {}),
  );
  assert.equal(state.brands[0].brand, "new");
  state = searchReducer(state, setNumber("2"));
  assert.equal(state.brandsStatus, "idle");
  assert.deepEqual(state.brands, []);
});
test("without a key both search stages use demo data and never call fetch", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("unexpected request");
  });
  const store = configureStore({ reducer: searchReducer });
  await store.dispatch(findBrands({ number: "W 914/2" }));
  assert.deepEqual(store.getState().brands, ["MANN-FILTER", "BOSCH"]);
  await store.dispatch(findOffers({ number: "W 914/2", brand: "MANN-FILTER" }));
  assert.equal(store.getState().offers.length, 4);
  assert.equal(fetchMock.mock.callCount(), 0);
});
