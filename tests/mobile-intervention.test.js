import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createMobileInterventionHandler } from "../server/mobile-intervention.js";
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
  habitOwner = "owner",
  providerReply = "What could you do instead?",
  environment = {},
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
                  user_id: habitOwner,
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
              choices: [{ message: { content: providerReply, reasoning: "private thinking" } }],
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
      ...environment,
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

test("GET probes return a method error without requiring secrets or calling providers", async () => {
  const h = harness({ environment: { GROQ_API_KEY: undefined } });
  h.request.method = "GET";
  await h.handler(h.request, h.response);
  assert.equal(h.response.code, 405);
  assert.equal(h.response.data.error, "Method not allowed.");
  assert.equal(h.response.headers.Allow, "POST,OPTIONS");
  assert.equal(h.calls.length, 0);
});

test("both website hosts can preflight, while native requests need no Origin", async () => {
  for (const origin of ["https://delimt.com", "https://www.delimt.com"]) {
    const h = harness();
    h.request.method = "OPTIONS";
    h.request.headers.origin = origin;
    await h.handler(h.request, h.response);
    assert.equal(h.response.code, 204);
    assert.equal(h.response.headers["Access-Control-Allow-Origin"], origin);
    assert.equal(h.response.headers["Access-Control-Allow-Headers"], "Authorization,Content-Type");
    assert.equal(h.calls.length, 0);
  }
  const h = harness();
  await h.handler(h.request, h.response);
  assert.equal(h.response.code, 200);
  assert.deepEqual(h.response.data, { reply: "What could you do instead?" });
  assert.equal(h.response.headers["Cache-Control"], "no-store");
});

test("missing server configuration returns an actionable error without provider calls", async () => {
  const h = harness({ environment: { GROQ_API_KEY: undefined } });
  await h.handler(h.request, h.response);
  assert.equal(h.response.code, 503);
  assert.equal(h.response.data.error, "Chat is not configured yet.");
  assert.equal(h.calls.length, 0);
});

test("existing Vite Supabase configuration is accepted by the server", async () => {
  const h = harness({ environment: {
    SUPABASE_URL: undefined,
    SUPABASE_ANON_KEY: undefined,
    VITE_SUPABASE_URL: "https://project.supabase.co",
    VITE_SUPABASE_ANON_KEY: "public",
  } });
  await h.handler(h.request, h.response);
  assert.equal(h.response.code, 200);
});

test("a returned habit belonging to another account cannot reach Groq", async () => {
  const h = harness({ habitOwner: "someone-else" });
  await h.handler(h.request, h.response);
  assert.equal(h.response.code, 404);
  assert.equal(h.calls.length, 1);
});

test("an empty provider answer is a retryable error rather than a successful chat", async () => {
  const h = harness({ providerReply: " " });
  await h.handler(h.request, h.response);
  assert.equal(h.response.code, 503);
  assert.doesNotMatch(JSON.stringify(h.response.data), /private|server-only/);
});

test("SPA deep links load the website while API paths bypass the HTML fallback", () => {
  const config = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
  const route = config.rewrites.find((r) => r.destination === "/index.html");
  const pattern = new RegExp(`^${route.source}$`);
  for (const path of ["/", "/app", "/app/history", "/blog/a-post", "/apiculture"])
    assert.equal(pattern.test(path), true, path);
  for (const path of ["/api", "/api/mobile-intervene", "/api/intervene", "/api/drip-emails"])
    assert.equal(pattern.test(path), false, path);
  assert.deepEqual(config.crons, [{ path: "/api/drip-emails", schedule: "0 9 * * *" }]);
});
