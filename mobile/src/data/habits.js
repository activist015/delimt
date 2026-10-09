/**
 * Android habit data foundation. Uses the existing Supabase habits table.
 * Keep the reason on habit.why; there is no account-wide reason or fallback
 * to a different habit. Callers supply their authenticated Supabase client.
 */
export const MAX_REASON_LENGTH = 140;
const HABIT_FIELDS = "id,user_id,name,emoji,why,excuse";

function requiredId(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} is required.`);
  }
  return value;
}

function readHabit(row, userId) {
  if (!row || row.user_id !== userId) {
    throw new Error("This habit is not available for the signed-in account.");
  }
  requiredId(row.id, "Habit ID");
  if (typeof row.name !== "string" || !row.name.trim()) {
    throw new Error("The habit needs a name.");
  }
  if (row.why != null && typeof row.why !== "string") {
    throw new Error("The habit reason must be text.");
  }
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    emoji: row.emoji ?? "",
    why: row.why ?? "",
    excuse: row.excuse ?? "",
  };
}

export function validateReason(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Add a reason for this habit before saving.");
  }
  const why = value.trim();
  if (why.length > MAX_REASON_LENGTH) {
    throw new Error(`Keep your reason within ${MAX_REASON_LENGTH} characters.`);
  }
  return why;
}

export function createHabitRepository(supabase) {
  async function ownerId() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return requiredId(data?.user?.id, "Signed-in account");
  }

  return {
    async list() {
      const userId = await ownerId();
      const { data, error } = await supabase
        .from("habits")
        .select(HABIT_FIELDS)
        .eq("user_id", userId);
      if (error) throw error;
      if (!Array.isArray(data)) throw new Error("Could not load your habits.");
      return data.map((row) => readHabit(row, userId));
    },

    async updateReason(habitId, value) {
      requiredId(habitId, "Habit ID");
      const why = validateReason(value);
      const userId = await ownerId();
      const { data, error } = await supabase
        .from("habits")
        .update({ why })
        .eq("user_id", userId)
        .eq("id", habitId)
        .select(HABIT_FIELDS)
        .single();
      if (error) throw error;
      const habit = readHabit(data, userId);
      if (habit.id !== habitId) throw new Error("The saved habit did not match.");
      return habit;
    },
  };
}

/** A missing/stale binding returns null, never the first habit in the list. */
export function habitForApp({ habits, bindings, packageName, userId }) {
  requiredId(userId, "Signed-in account");
  if (typeof packageName !== "string" || !packageName) return null;
  if (!bindings || !Object.hasOwn(bindings, packageName)) return null;
  const habitId = bindings[packageName];
  return habits.find((habit) => habit.id === habitId && habit.user_id === userId) ?? null;
}

/** Build the same habit payload already consumed by api/intervene.js. */
export function interventionHabit(habit) {
  if (!habit) throw new Error("Choose a habit before starting an intervention.");
  const validated = readHabit(habit, requiredId(habit.user_id, "Habit owner"));
  return {
    id: validated.id,
    name: validated.name,
    why: validated.why,
    excuse: validated.excuse,
  };
}
