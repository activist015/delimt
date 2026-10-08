import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function sendEmail(to, type) {
  const res = await fetch(`${process.env.VERCEL_URL}/api/send-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, type }),
  });
  return res.ok;
}

export default async function handler(req, res) {
  // Secure it so only Supabase can call it
  const secret = req.headers["x-cron-secret"];
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const now = new Date();

  // Day 3 — signed up 3 days ago
  const day3Start = new Date(now);
  day3Start.setDate(day3Start.getDate() - 3);
  day3Start.setHours(0, 0, 0, 0);
  const day3End = new Date(day3Start);
  day3End.setHours(23, 59, 59, 999);

  // Day 7 — signed up 7 days ago
  const day7Start = new Date(now);
  day7Start.setDate(day7Start.getDate() - 7);
  day7Start.setHours(0, 0, 0, 0);
  const day7End = new Date(day7Start);
  day7End.setHours(23, 59, 59, 999);

  // Fetch day 3 users
  const { data: day3Users } = await supabase
    .from("waitlist")
    .select("email")
    .gte("created_at", day3Start.toISOString())
    .lte("created_at", day3End.toISOString())
    .eq("email_day3_sent", false);

  // Fetch day 7 users
  const { data: day7Users } = await supabase
    .from("waitlist")
    .select("email")
    .gte("created_at", day7Start.toISOString())
    .lte("created_at", day7End.toISOString())
    .eq("email_day7_sent", false);

  let day3Count = 0;
  let day7Count = 0;

  // Send day 3 emails
  for (const user of day3Users || []) {
    const ok = await sendEmail(user.email, "howItWorks");
    if (ok) {
      await supabase
        .from("waitlist")
        .update({ email_day3_sent: true })
        .eq("email", user.email);
      day3Count++;
    }
  }

  // Send day 7 emails
  for (const user of day7Users || []) {
    const ok = await sendEmail(user.email, "shapeIt");
    if (ok) {
      await supabase
        .from("waitlist")
        .update({ email_day7_sent: true })
        .eq("email", user.email);
      day7Count++;
    }
  }

  return res.status(200).json({
    success: true,
    day3Sent: day3Count,
    day7Sent: day7Count,
  });
}