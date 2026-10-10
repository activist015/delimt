export function dayKey(
  value,
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type) => parts.find((p) => p.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function shiftDay(key, offset) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + offset))
    .toISOString()
    .slice(0, 10);
}

// A logged lapse makes that day a lapse even when another win follows.
// Multiple wins count once per calendar day. Missing days break the run.
export function habitProgress(
  events,
  habitId,
  { now = new Date(), timeZone } = {},
) {
  const today = dayKey(now, timeZone);
  const days = {};
  let wins = 0;
  let lapses = 0;
  for (const event of events) {
    if (
      event.habit_id !== habitId ||
      !["resisted", "gave_in"].includes(event.outcome)
    )
      continue;
    if (new Date(event.created_at) > new Date(now)) continue;
    const date = dayKey(event.created_at, timeZone);
    if (!date || date > today) continue;
    if (event.outcome === "resisted") wins++;
    else lapses++;
    if (days[date] !== "gave_in") days[date] = event.outcome;
  }
  let longest = 0,
    run = 0,
    previous = null;
  for (const date of Object.keys(days).sort()) {
    if (days[date] === "resisted")
      run = previous && shiftDay(previous, 1) === date ? run + 1 : 1;
    else run = 0;
    longest = Math.max(longest, run);
    previous = date;
  }
  let cursor = days[today] ? today : shiftDay(today, -1),
    current = 0;
  while (days[cursor] === "resisted") {
    current++;
    cursor = shiftDay(cursor, -1);
  }
  return { current, longest, wins, lapses, days, total: wins + lapses };
}
