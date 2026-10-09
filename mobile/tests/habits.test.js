import assert from "node:assert/strict";
import test from "node:test";
import {
  createHabitRepository,
  habitForApp,
  interventionHabit,
  validateReason,
} from "../src/data/habits.js";

const fixtures = () => [
  { id: "scroll", user_id: "faisal", name: "Doom scrolling", emoji: "", why: "I want my evenings back.", excuse: "Just five minutes." },
  { id: "shopping", user_id: "faisal", name: "Impulse buying", emoji: "", why: "I want to keep money for what matters.", excuse: "It's on sale." },
  { id: "other", user_id: "another-account", name: "Shopping", why: "Another account's private reason." },
];

// A tiny in-memory query adapter checks which records the repository changes.
// This is not a replacement for live Supabase/RLS integration tests.
function client(rows, { userId = "faisal", queryError = null, authError = null } = {}) {
  let queries = 0;
  return {
    auth: { async getUser() { return { data: { user: userId ? { id: userId } : null }, error: authError }; } },
    get queries() { return queries; },
    from(table) {
      assert.equal(table, "habits");
      queries++;
      const filters = [];
      let patch = null;
      let single = false;
      const query = {
        select() { return query; },
        eq(key, value) { filters.push([key, value]); return query; },
        update(value) { patch = value; return query; },
        single() { single = true; return query; },
        then(resolve, reject) {
          return Promise.resolve().then(() => {
            if (queryError) return { data: null, error: queryError };
            const found = rows.filter(row => filters.every(([key, value]) => row[key] === value));
            if (single && found.length !== 1) return { data: null, error: new Error("Habit not found.") };
            if (patch) found.forEach(row => Object.assign(row, patch));
            const result = found.map(row => ({ ...row }));
            return { data: single ? result[0] : result, error: null };
          }).then(resolve, reject);
        },
      };
      return query;
    },
  };
}

test("listing returns only the signed-in account's habits and distinct reasons", async () => {
  const loaded = await createHabitRepository(client(fixtures())).list();
  assert.deepEqual(loaded.map(h => h.id), ["scroll", "shopping"]);
  assert.notEqual(loaded[0].why, loaded[1].why);
});

test("editing shopping preserves scrolling and sends the new shopping reason to intervention", async () => {
  const rows = fixtures();
  const repository = createHabitRepository(client(rows));
  const saved = await repository.updateReason("shopping", "  Saving for tuition.  ");
  assert.equal(rows[0].why, "I want my evenings back.");
  assert.equal(rows[1].why, "Saving for tuition.");
  assert.deepEqual(interventionHabit(saved), { id: "shopping", name: "Impulse buying", why: "Saving for tuition.", excuse: "It's on sale." });
});

test("a different account's habit cannot be updated through this repository", async () => {
  const rows = fixtures();
  await assert.rejects(createHabitRepository(client(rows)).updateReason("other", "Overwrite"), /not found/);
  assert.equal(rows[2].why, "Another account's private reason.");
});

test("signed-out clients never query habits", async () => {
  const supabase = client(fixtures(), { userId: null });
  const repository = createHabitRepository(supabase);
  await assert.rejects(repository.list(), /Signed-in account/);
  await assert.rejects(repository.updateReason("shopping", "Saving"), /Signed-in account/);
  assert.equal(supabase.queries, 0);
});

test("server errors are surfaced instead of pretending an edit was saved", async () => {
  const rows = fixtures();
  const failure = new Error("Connection unavailable");
  const repository = createHabitRepository(client(rows, { queryError: failure }));
  await assert.rejects(repository.list(), error => error === failure);
  await assert.rejects(repository.updateReason("shopping", "Savings"), error => error === failure);
  assert.equal(rows[1].why, "I want to keep money for what matters.");
});

test("a protected shopping app resolves its own habit rather than the first habit", () => {
  const habits = fixtures();
  const resolved = habitForApp({ habits, bindings: { "com.example.shop": "shopping" }, packageName: "com.example.shop", userId: "faisal" });
  assert.equal(resolved.id, "shopping");
  assert.equal(interventionHabit(resolved).why, habits[1].why);
});

test("missing, removed, inherited, or other-account bindings do not use a fallback reason", () => {
  const options = { habits: fixtures(), packageName: "com.example.shop", userId: "faisal" };
  for (const bindings of [{}, { "com.example.shop": "deleted" }, { "com.example.shop": "other" }, Object.create({ "com.example.shop": "shopping" })]) {
    assert.equal(habitForApp({ ...options, bindings }), null);
  }
  assert.throws(() => interventionHabit(null), /Choose a habit/);
});

test("a legacy habit without a reason stays empty instead of borrowing another reason", () => {
  assert.equal(interventionHabit({ ...fixtures()[0], why: null }).why, "");
});

test("blank and oversized edits are rejected, while punctuation is preserved", () => {
  assert.throws(() => validateReason("   "), /Add a reason/);
  assert.throws(() => validateReason("x".repeat(141)), /140/);
  assert.equal(validateReason('Keep "my reason" & my choice.'), 'Keep "my reason" & my choice.');
});
