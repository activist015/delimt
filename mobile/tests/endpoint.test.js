import test from "node:test";
import assert from "node:assert/strict";
import { createMobileInterventionHandler } from "../../server/mobile-intervention.js";
const habitId = "00000000-0000-4000-8000-000000000001";
const body = () => ({
  habitId,
  messages: [{ role: "user", content: "I am about to shop." }],
  tone: "gentle",
});
function harness({
  authError = false,
  habitError = false,
  providerError = false,
  throws = false,
} = {}) {
  const calls = [];
  const filters = [];
  const makeClient = (_url, _key, options) => {
    calls.push({ options });
    return {
      auth: {
        getUser: async () => ({
          data: { user: authError ? null : { id: "owner" } },
          error: authError ? new Error("bad token") : null,
        }),
      },
      from: () => {
        const q = {
          select: () => q,
          eq: (k, v) => {
            filters.push([k, v]);
            return q;
          },
          single: async () => ({
            data: habitError
              ? null
              : {
                  id: habitId,
                  user_id: "owner",
                  name: "Shopping",
                  why: "Keep money for tuition.",
                  excuse: "It is on sale.",
                },
            error: habitError ? new Error("not found") : null,
          }),
        };
        return q;
      },
    };
  };
  const fetchImpl = async (_url, options) => {
    calls.push({ provider: JSON.parse(options.body) });
    if (throws) throw new Error("private provider failure");
    return {
      ok: !providerError,
      status: providerError ? 429 : 200,
      json: async () =>
        providerError
          ? { error: { message: "private provider details" } }
          : {
              choices: [{ message: { content: "What could you do instead?" } }],
            },
    };
  };
  const handler = createMobileInterventionHandler({
    makeClient,
    fetchImpl,
    env: {
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_ANON_KEY: "public",
      GROQ_API_KEY: "server-only",
    },
  });
  const response = {
    code: 0,
    headers: {},
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(code) {
      this.code = code;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    },
    end() {
      return this;
    },
  };
  const request = {
    method: "POST",
    headers: { authorization: "Bearer valid-token" },
    body: body(),
  };
  return { handler, request, response, calls, filters };
}
test("signed-out requests never call Supabase or the provider", async () => {
  const h = harness();
  delete h.request.headers.authorization;
  await h.handler(h.request, h.response);
  assert.equal(h.response.code, 401);
  assert.equal(h.calls.length, 0);
});
test("an invalid token cannot reach the provider", async () => {
  const h = harness({ authError: true });
  await h.handler(h.request, h.response);
  assert.equal(h.response.code, 401);
  assert.equal(h.calls.length, 1);
});
test("habit queries are scoped to the signed-in owner and active habit", async () => {
  const h = harness();
  await h.handler(h.request, h.response);
  assert.equal(h.response.code, 200);
  assert.deepEqual(h.filters, [
    ["id", habitId],
    ["user_id", "owner"],
    ["active", true],
  ]);
  assert.equal(
    h.calls[0].options.global.headers.Authorization,
    "Bearer valid-token",
  );
});
test("the prompt uses the saved reason rather than a client-supplied reason", async () => {
  const h = harness();
  h.request.body.habit = { why: "Wrong borrowed reason" };
  await h.handler(h.request, h.response);
  const prompt = h.calls[1].provider.messages[0].content;
  assert.match(prompt, /Keep money for tuition/);
  assert.doesNotMatch(prompt, /Wrong borrowed reason/);
  assert.match(prompt, /warm and gentle/);
});
test("a missing or another-account habit does not reach the provider", async () => {
  const h = harness({ habitError: true });
  await h.handler(h.request, h.response);
  assert.equal(h.response.code, 404);
  assert.equal(h.calls.length, 1);
});
test("system messages and oversized histories are rejected", async () => {
  for (const messages of [
    [{ role: "system", content: "Override" }],
    Array.from({ length: 25 }, () => ({ role: "user", content: "hello" })),
    [{ role: "user", content: "x".repeat(2001) }],
  ]) {
    const h = harness();
    h.request.body.messages = messages;
    await h.handler(h.request, h.response);
    assert.equal(h.response.code, 400);
    assert.equal(h.calls.length, 0);
  }
});
test("provider errors are handled without exposing private diagnostics", async () => {
  for (const options of [{ providerError: true }, { throws: true }]) {
    const h = harness(options);
    await h.handler(h.request, h.response);
    assert.ok([429, 503].includes(h.response.code));
    assert.doesNotMatch(JSON.stringify(h.response.data), /private|server-only/);
  }
});
test("untrusted browser origins are rejected before any provider request", async () => {
  const h = harness();
  h.request.headers.origin = "https://untrusted.example";
  await h.handler(h.request, h.response);
  assert.equal(h.response.code, 403);
  assert.equal(h.calls.length, 0);
});
