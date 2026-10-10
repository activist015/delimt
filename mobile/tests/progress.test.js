import test from "node:test";
import assert from "node:assert/strict";
import { habitProgress, dayKey } from "../src/data/progress.js";
const options = { now: "2026-10-09T22:00:00Z", timeZone: "Africa/Lagos" };
const event = (day, outcome = "resisted", habit_id = "shopping") => ({
  created_at: `2026-10-${day}T12:00:00Z`,
  outcome,
  habit_id,
});
test("multiple wins on the same day add a single streak day", () => {
  const p = habitProgress(
    [event("08"), event("09"), event("09")],
    "shopping",
    options,
  );
  assert.equal(p.current, 2);
  assert.equal(p.wins, 3);
});
test("a lapse followed by a same-day win keeps the day as a lapse", () => {
  const events = [event("08"), event("09", "gave_in"), event("09")];
  for (const list of [events, [...events].reverse()]) {
    const p = habitProgress(list, "shopping", options);
    assert.equal(p.current, 0);
    assert.equal(p.longest, 1);
  }
});
test("yesterday is retained until a full day is missed", () => {
  assert.equal(
    habitProgress([event("07"), event("08")], "shopping", options).current,
    2,
  );
  assert.equal(
    habitProgress([event("06"), event("07")], "shopping", options).current,
    0,
  );
});
test("history from another habit and future events do not inflate progress", () => {
  const p = habitProgress(
    [event("09", "resisted", "scroll"), event("10"), event("08")],
    "shopping",
    options,
  );
  assert.equal(p.current, 1);
  assert.equal(p.wins, 1);
});
test("a missing day breaks the run but preserves the longest earlier run", () => {
  const p = habitProgress(
    [event("02"), event("03"), event("04"), event("08"), event("09")],
    "shopping",
    options,
  );
  assert.equal(p.current, 2);
  assert.equal(p.longest, 3);
});
test("Nigeria calendar boundaries use local time rather than UTC", () => {
  assert.equal(dayKey("2026-10-08T23:30:00Z", "Africa/Lagos"), "2026-10-09");
  assert.equal(dayKey("bad-date", "Africa/Lagos"), null);
});
test("an exception is not a win or a lapse", () => {
  const p = habitProgress([event("09", "exception")], "shopping", options);
  assert.equal(p.current, 0);
  assert.equal(p.total, 0);
});
