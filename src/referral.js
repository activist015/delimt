import { supabase } from "./supabase";

export function generateCode(email) {
  return email.split("@")[0].replace(/[^a-z0-9]/gi, "").toLowerCase() +
    Math.random().toString(36).substring(2, 6);
}

export async function joinWaitlist(email, referredBy = null) {
  const { data: existing } = await supabase
    .from("waitlist")
    .select("*")
    .eq("email", email)
    .single();

  if (existing) return { data: existing, alreadyJoined: true };

  const { count } = await supabase
    .from("waitlist")
    .select("*", { count: "exact", head: true });

  const referral_code = generateCode(email);

  const { data, error } = await supabase
    .from("waitlist")
    .insert({
      email,
      referral_code,
      referred_by: referredBy,
      position: (count || 0) + 1,
      tier: "free",
    })
    .select()
    .single();

  if (error) throw error;

  if (referredBy) {
    const { data: referrer } = await supabase
      .from("waitlist")
      .select("*")
      .eq("referral_code", referredBy)
      .single();

    if (referrer) {
      const newCount = (referrer.referral_count || 0) + 1;
      let tier = referrer.tier;
      if (newCount >= 10) tier = "lifetime";
      else if (newCount >= 5) tier = "pro_free";
      else if (newCount >= 3) tier = "one_month_free";

      await supabase
        .from("waitlist")
        .update({
          referral_count: newCount,
          tier,
          position: Math.max(1, referrer.position - 50),
        })
        .eq("referral_code", referredBy);
    }
  }

  return { data, alreadyJoined: false };
}

export async function getFoundingCount() {
  const { count } = await supabase
    .from("waitlist")
    .select("*", { count: "exact", head: true })
    .eq("tier", "founding");
  return count || 0;
}

export async function getWaitlistCount() {
  const { count } = await supabase
    .from("waitlist")
    .select("*", { count: "exact", head: true });
  return count || 0;
}
