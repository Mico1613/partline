import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../server/index.js";
async function serve(t, options) {
  const server = createApp(options).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => {
    server.closeAllConnections();
    return new Promise((resolve) => server.close(resolve));
  });
  return (suffix) =>
    fetch(`http://127.0.0.1:${server.address().port}${suffix}`);
}
test("preserves and translates supplier 403 errors, encodes brand and number", async (t) => {
  let requested;
  const get = await serve(t, {
    apiKey: "secret",
    fetchImpl: async (url) => {
      requested = url;
      return Response.json({ error: "Invalid key client!" }, { status: 403 });
    },
  });
  const response = await get("/api/search?number=A%23&brand=B%26C");
  assert.equal(response.status, 403);
  assert.match((await response.json()).error, /Неверный ключ/);
  assert.equal(requested.searchParams.get("number"), "A#");
  assert.equal(requested.searchParams.get("brand"), "B&C");
  assert.equal(requested.searchParams.get("analogues"), "on");
});
test("validates params, missing key and unknown API routes", async (t) => {
  const get = await serve(t, { apiKey: "" });
  assert.equal((await get("/api/search")).status, 400);
  assert.equal((await get("/api/search?number=1")).status, 503);
  const missing = await get("/api/nope");
  assert.equal(missing.status, 404);
  assert.match(missing.headers.get("content-type"), /json/);
});
test("invalid JSON and timeout have safe errors", async (t) => {
  const get = await serve(t, {
    apiKey: "secret",
    fetchImpl: async () =>
      new Response("<html>bad gateway</html>", { status: 502 }),
  });
  assert.match(
    (await (await get("/api/search?number=1")).json()).error,
    /недоступен \(HTTP 502\)/,
  );
  const timeout = await serve(t, {
    apiKey: "secret",
    fetchImpl: async () => {
      throw new DOMException("secret", "TimeoutError");
    },
  });
  const message = (await (await timeout("/api/search?number=1")).json()).error;
  assert.match(message, /15 секунд/);
  assert.ok(!message.includes("secret"));
});
test("supplier error cannot expose the key", async (t) => {
  const get = await serve(t, {
    apiKey: "private-key",
    fetchImpl: async () =>
      Response.json({ error: "bad private-key" }, { status: 400 }),
  });
  assert.ok(
    !JSON.stringify(await (await get("/api/search?number=1")).json()).includes(
      "private-key",
    ),
  );
});
test("invalid successful JSON differs from server failure and body timeout", async (t) => {
  const get = await serve(t, {
    apiKey: "secret",
    fetchImpl: async () => new Response("not JSON"),
  });
  assert.match(
    (await (await get("/api/search?number=1")).json()).error,
    /некорректный ответ/,
  );
  const timeout = await serve(t, {
    apiKey: "secret",
    fetchImpl: async () => ({
      status: 200,
      ok: true,
      json: async () => {
        throw new DOMException("expired", "TimeoutError");
      },
    }),
  });
  assert.match(
    (await (await timeout("/api/search?number=1")).json()).error,
    /15 секунд/,
  );
  assert.equal((await get("/assets/missing.js")).status, 404);
});
test("mock mode works without key, supports brands/analogues and never calls supplier", async (t) => {
  const get = await serve(t, {
    apiKey: "",
    fetchImpl: async () => {
      assert.fail("Mock mode must not call supplier");
    },
  });
  const brands = await (await get("/api/search?number=W9142&mode=mock")).json();
  assert.equal(brands.goods.length, 2);
  const offers = await (
    await get("/api/search?number=W9142&brand=MANN-FILTER&mode=mock")
  ).json();
  assert.equal(offers.goods[0].analogues.length, 2);
  assert.equal(offers.goods[0].warehouses[0].price, 749);
  assert.deepEqual(
    (await (await get("/api/search?number=unknown&mode=mock")).json()).goods,
    [],
  );
  assert.equal((await get("/api/search?number=W9142&mode=api")).status, 503);
  assert.equal(
    (await get("/api/search?number=W9142&mode=invalid")).status,
    400,
  );
});

test("deployment mode cannot be overridden by client and healthcheck needs no key", async (t) => {
  const mock = await serve(t, {
    dataMode: "mock",
    apiKey: "",
    fetchImpl: async () => assert.fail("Hosted mock must not call supplier"),
  });
  const response = await mock("/api/search?number=W9142&mode=api");
  assert.equal(response.status, 200);
  assert.equal((await response.json()).goods.length, 2);
  assert.deepEqual(await (await mock("/api/health")).json(), { status: "ok" });
  let calls = 0;
  const api = await serve(t, {
    dataMode: "api",
    apiKey: "test-key",
    fetchImpl: async () => {
      calls++;
      return Response.json({ goods: [] });
    },
  });
  assert.deepEqual(
    await (await api("/api/search?number=W9142&mode=mock")).json(),
    { goods: [] },
  );
  assert.equal(calls, 1);
  const missingKey = await serve(t, { dataMode: "api", apiKey: "" });
  assert.equal(
    (await missingKey("/api/search?number=W9142&mode=mock")).status,
    503,
  );
  assert.throws(() => createApp({ dataMode: "wrong" }), /DATA_MODE/);
});
