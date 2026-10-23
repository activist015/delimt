import { supabase } from "./supabase";

async function publicCount(column) {
  const { data, error } = await supabase
    .from("waitlist_stats")
    .select(column)
    .eq("singleton", true)
    .maybeSingle();
  if (error) return 0;
  const value = Number(data?.[column]);
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

export async function getFoundingCount() {
  return publicCount("founding");
}

export async function getWaitlistCount() {
  return publicCount("total");
}
