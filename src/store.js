import {
  configureStore,
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";
import { getBrands, getOffers, readGoods } from "./data.js";
import { mockResponse } from "./mock.js";
async function request(params, signal) {
  // Static builds (including Pages) never need /api. Docker explicitly opts in.
  if (import.meta.env && import.meta.env.VITE_DATA_SOURCE !== "server") {
    signal.throwIfAborted();
    return readGoods(mockResponse(params.number, params.brand));
  }
  let response;
  try {
    response = await fetch(`/api/search?${new URLSearchParams(params)}`, {
      signal,
    });
  } catch (error) {
    if (signal.aborted || error.name === "AbortError") throw error;
    throw new Error(
      "Не удалось связаться с сервером. Проверьте подключение и повторите попытку.",
    );
  }
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("Не удалось прочитать ответ сервера. Повторите попытку.");
  }
  if (!response.ok)
    throw new Error(payload?.error || `Ошибка сервера (${response.status})`);
  return readGoods(payload);
}
export const findBrands = createAsyncThunk(
  "search/brands",
  async ({ number, mode = "api" }, { signal }) =>
    getBrands(await request({ number, mode }, signal)),
);
export const findOffers = createAsyncThunk(
  "search/offers",
  async ({ number, brand, mode = "api" }, { signal }) =>
    getOffers(await request({ number, brand, mode }, signal)),
);
const initialState = {
  mode: "mock",
  number: "",
  brand: null,
  brands: [],
  offers: [],
  brandsStatus: "idle",
  offersStatus: "idle",
  brandsError: "",
  offersError: "",
  brandsRequest: null,
  offersRequest: null,
};
const slice = createSlice({
  name: "search",
  initialState,
  reducers: {
    setNumber(state, action) {
      return { ...initialState, mode: state.mode, number: action.payload };
    },
    setMode(state, action) {
      return { ...initialState, number: state.number, mode: action.payload };
    },
    selectBrand(state, action) {
      state.brand = action.payload;
      state.offers = [];
      state.offersStatus = "idle";
      state.offersError = "";
      state.offersRequest = null;
    },
  },
  extraReducers: (builder) => {
    for (const [thunk, prefix] of [
      [findBrands, "brands"],
      [findOffers, "offers"],
    ]) {
      builder.addCase(thunk.pending, (s, a) => {
        if (prefix === "brands") {
          s.brand = null;
          s.brands = [];
          s.offers = [];
          s.offersStatus = "idle";
          s.offersError = "";
          s.offersRequest = null;
        }
        s[`${prefix}Status`] = "loading";
        s[`${prefix}Error`] = "";
        s[`${prefix}Request`] = a.meta.requestId;
      });
      builder.addCase(thunk.fulfilled, (s, a) => {
        if (s[`${prefix}Request`] !== a.meta.requestId) return;
        s[prefix] = a.payload;
        s[`${prefix}Status`] = "success";
      });
      builder.addCase(thunk.rejected, (s, a) => {
        if (s[`${prefix}Request`] !== a.meta.requestId) return;
        s[`${prefix}Status`] = a.meta.aborted ? "idle" : "error";
        s[`${prefix}Error`] =
          a.error.message || "Ошибка сети. Повторите попытку.";
      });
    }
  },
});
export const { setNumber, setMode, selectBrand } = slice.actions;
export const searchReducer = slice.reducer;
export const store = configureStore({ reducer: { search: searchReducer } });
