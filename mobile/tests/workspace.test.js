import test from "node:test";
import assert from "node:assert/strict";
import { loadEvents, saveOutcome } from "../src/data/workspace.js";
const habit = { id: "shopping", user_id: "owner" };
function client({
  insertError = null,
  existing = null,
  insertResult = null,
  pages = [],
  userId = "owner",
} = {}) {
  const calls = [];
  return {
    calls,
    auth: {
      getUser: async () => ({
        data: { user: userId ? { id: userId } : null },
        error: null,
      }),
    },
    from(table) {
      const filters = [];
      let insert = null;
      const q = {
        select: () => q,
        eq(k, v) {
          filters.push([k, v]);
          return q;
        },
        order: () => q,
        range(start, end) {
          calls.push({ table, start, end, filters });
          return Promise.resolve({
            data: pages[start / 500] || [],
            error: null,
          });
        },
        insert(value) {
          insert = value;
          return q;
        },
        single: async () => {
          calls.push({ table, filters, insert });
          return insert
            ? {
                data: insertResult || {
                  ...insert,
                  created_at: "2026-10-09T16:00:00Z",
                },
                error: insertError,
              }
            : {
                data: existing,
                error: existing ? null : new Error("not found"),
              };
        },
      };
      return q;
    },
  };
}
test("a retry resolves the same saved session instead of inserting a second win", async () => {
  const saved = {
    id: "session",
    user_id: "owner",
    habit_id: "shopping",
    outcome: "resisted",
  };
  const supabase = client({ insertError: { code: "23505" }, existing: saved });
  assert.deepEqual(
    await saveOutcome(supabase, {
      id: "session",
      habit,
      outcome: "resisted",
      messages: [],
    }),
    saved,
  );
  assert.equal(supabase.calls.filter((c) => c.insert).length, 1);
  assert.ok(
    supabase.calls[1].filters.some(
      ([k, v]) => k === "user_id" && v === "owner",
    ),
  );
});
test("an already-saved session cannot be changed to a different outcome", async () => {
  const supabase = client({
    insertError: { code: "23505" },
    existing: {
      id: "session",
      user_id: "owner",
      habit_id: "shopping",
      outcome: "gave_in",
    },
  });
  await assert.rejects(
    saveOutcome(supabase, {
      id: "session",
      habit,
      outcome: "resisted",
      messages: [],
    }),
    /different outcome/,
  );
});
test("a failed save is surfaced and a different account cannot save this habit", async () => {
  const fail = new Error("Network failed");
  await assert.rejects(
    saveOutcome(client({ insertError: fail }), {
      id: "session",
      habit,
      outcome: "resisted",
      messages: [],
    }),
    (e) => e === fail,
  );
  const other = client({ userId: "other" });
  await assert.rejects(
    saveOutcome(other, {
      id: "session",
      habit,
      outcome: "resisted",
      messages: [],
    }),
    /another account/,
  );
  assert.equal(other.calls.length, 0);
});
test("a mismatched save response does not count as confirmed activity", async () => {
  const supabase = client({
    insertResult: {
      id: "wrong",
      user_id: "owner",
      habit_id: "shopping",
      outcome: "resisted",
    },
  });
  await assert.rejects(
    saveOutcome(supabase, {
      id: "session",
      habit,
      outcome: "resisted",
      messages: [],
    }),
    /did not match/,
  );
});
test("history loads all pages and filters every page to the current account", async () => {
  const page = Array.from({ length: 500 }, (_, id) => ({
    id,
    user_id: "owner",
  }));
  const supabase = client({ pages: [page, [{ id: 500, user_id: "owner" }]] });
  assert.equal((await loadEvents(supabase)).length, 501);
  assert.deepEqual(
    supabase.calls.map((c) => [c.start, c.end]),
    [
      [0, 499],
      [500, 999],
    ],
  );
  assert.ok(
    supabase.calls.every((c) =>
      c.filters.some(([k, v]) => k === "user_id" && v === "owner"),
    ),
  );
});
test("signed-out clients cannot load history", async () => {
  const supabase = client({ userId: null });
  await assert.rejects(loadEvents(supabase), /Sign in again/);
  assert.equal(supabase.calls.length, 0);
});
