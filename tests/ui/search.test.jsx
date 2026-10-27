import { describe, it, expect, vi } from "vitest";
import { render, screen, within, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import App from "../../src/App.jsx";
import { searchReducer, setMode } from "../../src/store.js";
import { mockResponse } from "../../src/mock.js";

function setup(handler) {
  const store = configureStore({ reducer: { search: searchReducer } });
  const fetchMock = vi.fn(
    handler ||
      (async (url) => {
        const params = new URL(url, "http://localhost").searchParams;
        return Response.json(
          mockResponse(params.get("number"), params.get("brand")),
        );
      }),
  );
  vi.stubGlobal("fetch", fetchMock);
  render(
    <Provider store={store}>
      <App />
    </Provider>,
  );
  return { store, fetchMock, user: userEvent.setup() };
}
const article = () => screen.getByRole("textbox", { name: "Артикул запчасти" });
async function search(user) {
  await user.type(article(), "W 914/2");
  await user.click(screen.getByRole("button", { name: "Найти", exact: true }));
  await screen.findByRole("button", { name: "MANN-FILTER", exact: true });
}
const bodyRows = () =>
  within(screen.getByRole("table")).getAllByRole("row").slice(1);

describe("search workflow with real Redux and request thunks", () => {
  it("loads brands automatically after typing", async () => {
    const { user, fetchMock } = setup();
    await user.type(article(), "W 914/2");
    expect(fetchMock).not.toHaveBeenCalled();
    await screen.findByRole("button", { name: "MANN-FILTER" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(
      new URL(fetchMock.mock.calls[0][0], "http://localhost").searchParams.get(
        "number",
      ),
    ).toBe("W 914/2");
  });

  it("manual search cancels debounce; filters, counter and price sorting match results", async () => {
    const { user, fetchMock } = setup();
    await search(user);
    await act(() => new Promise((resolve) => setTimeout(resolve, 550)));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "MANN-FILTER" }));
    await screen.findByRole("table");
    expect(bodyRows()).toHaveLength(4);
    expect(document.querySelector(".count-badge")).toHaveTextContent("4");
    await user.click(
      screen.getByRole("checkbox", { name: "Только в наличии" }),
    );
    expect(bodyRows()).toHaveLength(3);
    expect(document.querySelector(".count-badge")).toHaveTextContent("3");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Сортировать предложения" }),
      "price",
    );
    expect(bodyRows()[0]).toHaveTextContent("BOSCH");
    expect(bodyRows()[0]).toHaveTextContent("620");
    await user.click(
      screen.getByRole("button", { name: "Найти", exact: true }),
    );
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    await screen.findByRole("button", { name: "MANN-FILTER" });
  });

  it("shows loading, localized network failure and successful retry", async () => {
    let reject;
    const { user, fetchMock } = setup(
      () =>
        new Promise((_, fail) => {
          reject = fail;
        }),
    );
    await user.type(article(), "W 914/2");
    await user.click(
      screen.getByRole("button", { name: "Найти", exact: true }),
    );
    expect(screen.getByRole("status")).toHaveTextContent("Ищем производителей");
    await act(async () => reject(new TypeError("Failed to fetch")));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Не удалось связаться",
    );
    fetchMock.mockImplementation(async () =>
      Response.json(mockResponse("W 914/2")),
    );
    await user.click(screen.getByRole("button", { name: "Повторить" }));
    await screen.findByRole("button", { name: "MANN-FILTER" });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("handles empty brands and empty offers", async () => {
    const { user, fetchMock } = setup(async () =>
      Response.json({ goods: [{}] }),
    );
    await user.type(article(), "unknown");
    await user.click(
      screen.getByRole("button", { name: "Найти", exact: true }),
    );
    await screen.findByText(/Производители не найдены/);
    fetchMock.mockImplementation(async (url) =>
      new URL(url, "http://localhost").searchParams.has("brand")
        ? Response.json({ goods: [] })
        : Response.json(mockResponse("W 914/2")),
    );
    await user.clear(article());
    await search(user);
    await user.click(screen.getByRole("button", { name: "MANN-FILTER" }));
    await screen.findByText(/Предложений и аналогов не найдено/);
  });

  it("changing brand aborts a pending request and ignores its late response", async () => {
    const { user, fetchMock } = setup();
    await search(user);
    let resolveOld;
    let oldSignal;
    fetchMock.mockImplementation((url, { signal }) => {
      const brand = new URL(url, "http://localhost").searchParams.get("brand");
      if (brand === "MANN-FILTER") {
        oldSignal = signal;
        return new Promise((resolve) => {
          resolveOld = resolve;
        });
      }
      return Promise.resolve(
        Response.json({
          goods: [
            {
              brand: "BOSCH",
              number: "NEW",
              name: "Новая деталь",
              warehouses: [{ id: "1", price: 10, stock: 1 }],
            },
          ],
        }),
      );
    });
    await user.click(screen.getByRole("button", { name: "MANN-FILTER" }));
    expect(screen.getByRole("status")).toHaveTextContent("Загружаем");
    await user.click(screen.getByRole("button", { name: "BOSCH" }));
    expect(oldSignal.aborted).toBe(true);
    await screen.findByText("Новая деталь");
    await act(async () =>
      resolveOld(Response.json(mockResponse("W 914/2", "MANN-FILTER"))),
    );
    expect(bodyRows()).toHaveLength(1);
    expect(bodyRows()[0]).toHaveTextContent("NEW");
  });

  it("switching mode aborts pending search and preserves the article", async () => {
    let oldSignal;
    const { user, store, fetchMock } = setup((_, { signal }) => {
      oldSignal = signal;
      return new Promise(() => {});
    });
    await user.type(article(), "W 914/2");
    await user.click(
      screen.getByRole("button", { name: "Найти", exact: true }),
    );
    fetchMock.mockImplementation(async () =>
      Response.json({ error: "Неверный ключ покупателя." }, { status: 403 }),
    );
    act(() => store.dispatch(setMode("api")));
    expect(oldSignal.aborted).toBe(true);
    expect(article()).toHaveValue("W 914/2");
    expect(await screen.findByRole("alert")).toHaveTextContent("Неверный ключ");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][0]).toContain("mode=api");
  });
});

it("static build completes both search stages without any API requests", async () => {
  vi.stubEnv("VITE_DATA_SOURCE", "mock");
  const { user, fetchMock } = setup(async () => {
    throw new Error("No server on Pages");
  });
  await search(user);
  await user.click(screen.getByRole("button", { name: "MANN-FILTER" }));
  await screen.findByRole("table");
  expect(bodyRows()).toHaveLength(4);
  expect(fetchMock).not.toHaveBeenCalled();
});
