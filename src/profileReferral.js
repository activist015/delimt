const STORAGE_KEY = "delimt_ref";
const VALID_CODE = /^[A-Za-z0-9_-]{1,128}$/;

export function pendingReferral(storage) {
  try {
    const value = storage?.getItem(STORAGE_KEY);
    return typeof value === "string" && VALID_CODE.test(value) ? value : null;
  } catch { return null; }
}

export function captureReferral(storage, search) {
  try {
    const value = new URLSearchParams(search).get("ref");
    if (value && VALID_CODE.test(value)) storage?.setItem(STORAGE_KEY, value);
  } catch { /* Storage may be disabled by the browser. */ }
}

function clearIfUnchanged(storage, code) {
  try {
    if (storage?.getItem(STORAGE_KEY) === code) storage.removeItem(STORAGE_KEY);
  } catch { /* An already-counted claim is safe to retry. */ }
}

export async function applyPendingReferral(client, expectedUserId, storage) {
  const code = pendingReferral(storage);
  if (!code) return "none";
  if (!client || typeof expectedUserId !== "string" || !expectedUserId) return "retry";
  // Email confirmation can leave signup without a session. Keep the pending
  // invitation until a verified session returns rather than clearing it early.
  let auth;
  try { auth = await client.auth.getUser(); } catch { return "retry"; }
  if (auth.error || !auth.data?.user || auth.data.user.id !== expectedUserId)
    return "retry";

  try {
    const existing = await client.from("profiles")
      .select("id,referred_by").eq("id", expectedUserId).maybeSingle();
    if (existing.error || existing.data?.id !== expectedUserId) return "retry";
    if (existing.data.referred_by) {
      clearIfUnchanged(storage, code);
      return "already";
    }
    const result = await client.from("profiles")
      .update({ referred_by: code }).eq("id", expectedUserId)
      .select("id,referred_by").maybeSingle();
    if (["22023", "23514"].includes(result.error?.code)) {
      clearIfUnchanged(storage, code);
      return "ignored";
    }
    if (result.error || result.data?.id !== expectedUserId || result.data.referred_by !== code)
      return "retry";
    clearIfUnchanged(storage, code);
    return "applied";
  } catch { return "retry"; }
}
