import {
  configureStore,
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";
import { getBrands, getOffers, readGoods } from "./data.js";
import { mockResponse } from "./mock.js";
const env = import.meta.env || {};
const API_KEY = env.VITE_FAVORIT_API_KEY;
const API_URL =
  env.VITE_FAVORIT_API_URL || "https://api.favorit-parts.ru/hs/hsprice/";
const TIMEOUT_MS = 15000;
const translations = {
  "Empty key!": "Не указан ключ покупателя.",
  "Invalid key client!": "Неверный ключ покупателя.",
  "Invalid access key": "Неверный ключ покупателя.",
  "Empty number goods!": "Не указан артикул детали.",
  "Request quota exceeded!": "Превышен лимит запросов поставщика.",
};
const translate = (error) =>
  (Array.isArray(error) ? error : [error])
    .map((e) => translations[String(e)] || String(e))
    .join("; ");
// Without a key in .env the app runs on demo data (this is what Pages shows).
export const isDemo = !API_KEY;
async function request({ number, brand }, signal) {
  if (isDemo) {
    signal.throwIfAborted();
    return readGoods(mockResponse(number, brand));
  }
  const url = new URL(API_URL);
  url.search = new URLSearchParams({
    key: API_KEY,
    number,
    ...(brand ? { brand, analogues: "on" } : {}),
  });
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  let response;
  try {
    response = await fetch(url, { signal: AbortSignal.any([signal, timeout]) });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new Error(
      timeout.aborted
        ? "Сервис не ответил за 15 секунд. Повторите попытку."
        : "Не удалось связаться с сервисом. Проверьте подключение и повторите попытку.",
      { cause: error },
    );
  }
  if (response.status >= 500)
    throw new Error(
      `Сервис поставщика недоступен (HTTP ${response.status}). Повторите попытку.`,
    );
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error(
      "Сервис поставщика вернул некорректный ответ. Повторите попытку.",
    );
  }
  if (payload?.error) throw new Error(translate(payload.error));
  if (!response.ok)
    throw new Error(`Ошибка сервиса (HTTP ${response.status}).`);
  return readGoods(payload);
}
export const findBrands = createAsyncThunk(
  "search/brands",
  async ({ number }, { signal }) =>
    getBrands(await request({ number }, signal)),
);
export const findOffers = createAsyncThunk(
  "search/offers",
  async ({ number, brand }, { signal }) =>
    getOffers(await request({ number, brand }, signal)),
);
const initialState = {
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
    setNumber(_, action) {
      return { ...initialState, number: action.payload };
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
export const { setNumber, selectBrand } = slice.actions;
export const searchReducer = slice.reducer;
export const store = configureStore({ reducer: { search: searchReducer } });
