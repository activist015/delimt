async function callEmailAPI(to, type) {
  const res = await fetch("/api/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, type }),
  });
  const data = await res.json();
  if (!res.ok) console.error("Email error:", data);
  return res.ok;
}

export const sendWelcomeEmail = (email) => callEmailAPI(email, "welcome");
export const sendFoundingMemberEmail = (email) => callEmailAPI(email, "founding");