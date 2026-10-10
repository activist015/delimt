async function owner(supabase) {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data?.user) throw new Error("Sign in again to continue.");
  return data.user.id;
}
export async function loadEvents(supabase) {
  const userId = await owner(supabase);
  const events = [];
  // Read every page; never present a truncated history as all-time progress.
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase
      .from("interventions")
      .select("id,user_id,habit_id,outcome,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + 499);
    if (error) throw error;
    if (!Array.isArray(data) || data.some((row) => row.user_id !== userId))
      throw new Error("Could not load your activity.");
    events.push(...data);
    if (data.length < 500) return events;
  }
}
export async function saveOutcome(supabase, { id, habit, outcome, messages }) {
  if (!id || !["resisted", "gave_in"].includes(outcome))
    throw new Error("Choose an outcome.");
  const userId = await owner(supabase);
  if (habit.user_id !== userId)
    throw new Error("This habit belongs to another account.");
  const payload = {
    id,
    user_id: userId,
    habit_id: habit.id,
    outcome,
    messages,
  };
  const { data, error } = await supabase
    .from("interventions")
    .insert(payload)
    .select("id,user_id,habit_id,outcome,created_at")
    .single();
  if (!error) {
    if (
      !data ||
      data.id !== id ||
      data.user_id !== userId ||
      data.habit_id !== habit.id ||
      data.outcome !== outcome
    )
      throw new Error("The saved activity did not match this session.");
    return data;
  }
  if (error.code !== "23505") throw error;
  // A retry keeps the same UUID. Resolve an ambiguous network result instead
  // of inserting another win or changing the outcome of an existing record.
  const result = await supabase
    .from("interventions")
    .select("id,user_id,habit_id,outcome,created_at")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  if (result.error) throw result.error;
  if (result.data.habit_id !== habit.id || result.data.outcome !== outcome)
    throw new Error("This session already has a different outcome.");
  return result.data;
}
export async function requestIntervention(
  supabase,
  { habit, messages, tone, signal },
) {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token)
    throw new Error("Sign in again to continue.");
  const base = (
    process.env.EXPO_PUBLIC_API_URL || "https://delimt.com"
  ).replace(/\/$/, "");
  const response = await fetch(`${base}/api/mobile-intervene`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.session.access_token}`,
    },
    body: JSON.stringify({
      habitId: habit.id,
      messages: messages.slice(-24),
      tone,
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (
    !response.ok ||
    typeof result.reply !== "string" ||
    !result.reply.trim()
  ) {
    throw new Error(
      response.status === 404
        ? "Chat is not connected to this build yet. You can still record your choice."
        : result.error || "Could not reach Delimt. Please try again.",
    );
  }
  return result.reply;
}
