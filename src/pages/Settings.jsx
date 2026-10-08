import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../AuthContext";

export default function Settings({ onBack }) {
  const { user, signOut } = useAuth();
  const [name, setName] = useState("");
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [referralCode, setReferralCode] = useState("");
  const [referralCount, setReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, referral_code, referral_count")
      .eq("id", user.id)
      .single();

    if (profile?.name) setName(profile.name);
    if (profile?.referral_code) setReferralCode(profile.referral_code);
    if (profile?.referral_count) setReferralCount(profile.referral_count);

    const { data: habitsData } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", user.id)
      .eq("active", true)
      .order("created_at");

    if (habitsData) setHabits(habitsData);
    setLoading(false);
  };

  const saveName = async () => {
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ name })
      .eq("id", user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const saveHabit = async (habit) => {
    await supabase
      .from("habits")
      .update({ why: habit.why, excuse: habit.excuse })
      .eq("id", habit.id);
    setEditingHabit(null);
    loadData();
  };

  const deleteHabit = async (habitId) => {
    await supabase
      .from("habits")
      .update({ active: false })
      .eq("id", habitId);
    setDeleteConfirm(null);
    loadData();
  };

  const copyReferral = () => {
    const link = `https://delimt.com?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = () => {
    const link = `https://delimt.com?ref=${referralCode}`;
    const text = `delimt is an AI that argues you out of your bad habits in real time. I'm using it to fight doom-scrolling and impulse buying. Try it free:`;
    if (navigator.share) {
      navigator.share({ title: "delimt", text, url: link });
    } else {
      copyReferral();
    }
  };

  const submitFeedback = async () => {
    if (!feedback.trim()) {
      setFeedbackError("Please write something first.");
      return;
    }
    if (rating === 0) {
      setFeedbackError("Please pick a rating.");
      return;
    }
    setFeedbackLoading(true);
    setFeedbackError("");
    const { error } = await supabase.from("feedback").insert({
      user_id: user.id,
      email: user.email,
      rating,
      message: feedback.trim(),
    });
    if (error) {
      setFeedbackError("Something went wrong. Try again.");
    } else {
      setFeedbackSent(true);
      setFeedback("");
      setRating(0);
    }
    setFeedbackLoading(false);
  };

  if (loading) return (
    <div style={{ textAlign: "center", color: "#FF3333", fontSize: 12, letterSpacing: "3px", paddingTop: 60 }}>
      LOADING...
    </div>
  );

  return (
    <div>
      {/* HEADER */}
      <div style={s.header}>
        <button onClick={onBack} style={s.backBtn}>← Back</button>
        <div style={s.title}>SETTINGS</div>
      </div>

      {/* PROFILE */}
      <div style={s.section}>
        <div style={s.sectionLabel}>YOUR PROFILE</div>
        <div style={s.card}>
          <div style={s.field}>
            <label style={s.fieldLabel}>NAME</label>
            <div style={s.inputRow}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What should delimt call you?"
                style={s.input}
                onKeyDown={(e) => e.key === "Enter" && saveName()}
              />
              <button
                onClick={saveName}
                disabled={saving}
                style={s.saveBtn}
              >
                {saved ? "✓" : saving ? "..." : "Save"}
              </button>
            </div>
          </div>
          <div style={s.accountInfo}>
            <span style={s.accountLabel}>ACCOUNT</span>
            <span style={s.accountEmail}>{user?.email}</span>
          </div>
        </div>
      </div>

      {/* REFERRAL */}
      <div style={s.section}>
        <div style={s.sectionLabel}>SHARE DELIMT</div>
        <div style={s.card}>
          <div style={s.referralIntro}>
            Know someone fighting the same habits? Share your link and help them fight back.
          </div>

          <div style={s.field}>
            <label style={s.fieldLabel}>YOUR REFERRAL LINK</label>
            <div style={s.referralLinkRow}>
              <div style={s.referralLink}>
                delimt.com?ref={referralCode}
              </div>
              <button onClick={copyReferral} style={s.saveBtn}>
                {copied ? "✓" : "Copy"}
              </button>
            </div>
          </div>

          <button onClick={shareReferral} style={s.shareBtn}>
            Share with a friend →
          </button>

          <div style={s.referralStats}>
            <div style={s.referralStatNum}>{referralCount}</div>
            <div style={s.referralStatLabel}>
              {referralCount === 1
                ? "person joined through your link"
                : "people joined through your link"
              }
            </div>
          </div>
        </div>
      </div>

      {/* HABITS */}
      <div style={s.section}>
        <div style={s.sectionLabel}>YOUR HABITS</div>
        <div style={s.habitList}>
          {habits.map((habit) => (
            <div key={habit.id} style={s.habitCard}>
              {editingHabit?.id === habit.id ? (
                <div style={s.editForm}>
                  <div style={s.editHeader}>
                    <span style={{ fontSize: 24 }}>
                      {habit.emoji || "⚡"}
                    </span>
                    <span style={s.editName}>{habit.name}</span>
                  </div>

                  <div style={s.field}>
                    <label style={s.fieldLabel}>WHY DO YOU WANT TO STOP?</label>
                    <input
                      value={editingHabit.why || ""}
                      onChange={(e) => setEditingHabit({ ...editingHabit, why: e.target.value })}
                      placeholder="e.g. It makes me feel empty after"
                      style={s.input}
                      autoFocus
                    />
                  </div>

                  <div style={s.field}>
                    <label style={s.fieldLabel}>YOUR USUAL EXCUSE</label>
                    <input
                      value={editingHabit.excuse || ""}
                      onChange={(e) => setEditingHabit({ ...editingHabit, excuse: e.target.value })}
                      placeholder="e.g. Just 5 minutes won't hurt"
                      style={s.input}
                    />
                  </div>

                  <div style={s.editActions}>
                    <button
                      onClick={() => setEditingHabit(null)}
                      style={s.cancelBtn}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => saveHabit(editingHabit)}
                      style={s.saveHabitBtn}
                    >
                      Save changes →
                    </button>
                  </div>
                </div>

              ) : deleteConfirm === habit.id ? (
                <div style={s.deleteConfirm}>
                  <div style={s.deleteQuestion}>
                    Remove <span style={s.red}>{habit.name}</span>?
                  </div>
                  <div style={s.deleteNote}>
                    Your streak and history will be kept.
                  </div>
                  <div style={s.deleteActions}>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      style={s.cancelBtn}
                    >
                      Keep it
                    </button>
                    <button
                      onClick={() => deleteHabit(habit.id)}
                      style={s.deleteBtn}
                    >
                      Remove
                    </button>
                  </div>
                </div>

              ) : (
                <div style={s.habitView}>
                  <div style={s.habitLeft}>
                    <span style={{ fontSize: 24 }}>
                      {habit.emoji || "⚡"}
                    </span>
                    <div>
                      <div style={s.habitName}>{habit.name}</div>
                      {habit.why ? (
                        <div style={s.habitMeta}>"{habit.why}"</div>
                      ) : (
                        <div style={{ ...s.habitMeta, color: "#FF333366" }}>
                          No profile yet — tap edit
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={s.habitActions}>
                    <button
                      onClick={() => setEditingHabit({ ...habit })}
                      style={s.editBtn}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(habit.id)}
                      style={s.deleteIconBtn}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {habits.length === 0 && (
            <div style={s.empty}>
              No habits yet. Add one from the dashboard.
            </div>
          )}
        </div>
      </div>

      {/* FEEDBACK */}
      <div style={s.section}>
        <div style={s.sectionLabel}>GIVE FEEDBACK</div>
        <div style={s.card}>
          {feedbackSent ? (
            <div style={s.feedbackSuccess}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🙏</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
                Thank you. Genuinely.
              </div>
              <div style={{ fontSize: 13, color: "#666", lineHeight: 1.7 }}>
                Every response shapes what we build next.
              </div>
              <button
                onClick={() => setFeedbackSent(false)}
                style={{ ...s.cancelBtn, marginTop: 16, width: "100%" }}
              >
                Send more feedback
              </button>
            </div>
          ) : (
            <>
              <div style={s.field}>
                <label style={s.fieldLabel}>HOW IS DELIMT WORKING FOR YOU?</label>
                <div style={s.stars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      style={{
                        ...s.starBtn,
                        color: star <= rating ? "#FF3333" : "#333",
                      }}
                    >
                      {star <= rating ? "★" : "☆"}
                    </button>
                  ))}
                  <span style={s.ratingLabel}>
                    {rating === 0 && "tap to rate"}
                    {rating === 1 && "Not working for me"}
                    {rating === 2 && "Needs a lot of work"}
                    {rating === 3 && "It's okay"}
                    {rating === 4 && "Pretty good"}
                    {rating === 5 && "Genuinely love it"}
                  </span>
                </div>
              </div>

              <div style={s.field}>
                <label style={s.fieldLabel}>WHAT SHOULD WE KNOW?</label>
                <textarea
                  value={feedback}
                  onChange={(e) => {
                    setFeedback(e.target.value);
                    setFeedbackError("");
                  }}
                  placeholder="What's working? What's broken? What do you wish delimt did?"
                  style={s.textarea}
                  rows={4}
                />
              </div>

              {feedbackError && (
                <div style={s.feedbackError}>{feedbackError}</div>
              )}

              <button
                onClick={submitFeedback}
                disabled={feedbackLoading}
                style={s.saveBtn}
              >
                {feedbackLoading ? "..." : "Send feedback →"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ACCOUNT */}
      <div style={s.section}>
        <div style={s.sectionLabel}>ACCOUNT</div>
        <div style={s.card}>
          <div style={s.dangerRow}>
            <div>
              <div style={s.dangerTitle}>Sign out</div>
              <div style={s.dangerSub}>You'll need to sign back in</div>
            </div>
            <button onClick={signOut} style={s.signOutBtn}>
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* VERSION */}
      <div style={s.version}>
        delimt v1.0 · PWA
      </div>
    </div>
  );
}

const s = {
  header: {
    display: "flex", alignItems: "center", gap: 16, marginBottom: 28,
  },
  backBtn: {
    background: "none", border: "none", color: "#666", cursor: "pointer",
    fontSize: 13, fontFamily: "'DM Mono',monospace", letterSpacing: "1px",
  },
  title: {
    fontSize: 10, letterSpacing: "4px", color: "#FF3333",
  },
  section: { marginBottom: 32 },
  sectionLabel: {
    fontSize: 10, letterSpacing: "4px", color: "#FF3333", marginBottom: 16,
  },
  card: {
    background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: 12,
    padding: 20, display: "flex", flexDirection: "column", gap: 16,
  },
  field: { display: "flex", flexDirection: "column", gap: 8 },
  fieldLabel: { fontSize: 10, letterSpacing: "3px", color: "#555" },
  inputRow: { display: "flex", gap: 8 },
  input: {
    flex: 1, padding: "12px 14px", background: "#0a0a0a",
    border: "1px solid #222", borderRadius: 8, color: "#e8e8e0",
    fontSize: 14, fontFamily: "'DM Mono',monospace", outline: "none",
  },
  saveBtn: {
    padding: "12px 16px", background: "#FF3333", border: "none",
    borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700,
    cursor: "pointer", fontFamily: "'DM Mono',monospace", whiteSpace: "nowrap",
  },
  accountInfo: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    paddingTop: 12, borderTop: "1px solid #111",
  },
  accountLabel: { fontSize: 10, letterSpacing: "3px", color: "#555" },
  accountEmail: { fontSize: 12, color: "#444" },
  referralIntro: { fontSize: 13, color: "#888", lineHeight: 1.7 },
  referralLinkRow: { display: "flex", gap: 8 },
  referralLink: {
    flex: 1, background: "#0a0a0a", border: "1px solid #222",
    borderRadius: 8, padding: "12px 14px", fontSize: 12, color: "#666",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  shareBtn: {
    padding: "12px", background: "transparent",
    border: "1px solid #FF333355", borderRadius: 8,
    color: "#FF3333", fontSize: 13, fontWeight: 700,
    cursor: "pointer", fontFamily: "'DM Mono',monospace", letterSpacing: "1px",
  },
  referralStats: {
    display: "flex", alignItems: "center", gap: 12,
    paddingTop: 12, borderTop: "1px solid #111",
  },
  referralStatNum: { fontSize: 28, fontWeight: 900, color: "#FF3333" },
  referralStatLabel: { fontSize: 12, color: "#666", lineHeight: 1.5 },
  habitList: { display: "flex", flexDirection: "column", gap: 10 },
  habitCard: {
    background: "#0f0f0f", border: "1px solid #1a1a1a",
    borderRadius: 12, padding: "16px 18px",
  },
  habitView: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between", gap: 12,
  },
  habitLeft: {
    display: "flex", alignItems: "center", gap: 12,
    flex: 1, minWidth: 0,
  },
  habitName: { fontSize: 14, fontWeight: 700, marginBottom: 4 },
  habitMeta: {
    fontSize: 11, color: "#444", fontStyle: "italic",
    whiteSpace: "nowrap", overflow: "hidden",
    textOverflow: "ellipsis", maxWidth: 200,
  },
  habitActions: {
    display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
  },
  editBtn: {
    padding: "8px 14px", background: "transparent",
    border: "1px solid #333", borderRadius: 6,
    color: "#888", fontSize: 11, cursor: "pointer",
    fontFamily: "'DM Mono',monospace",
  },
  deleteIconBtn: {
    background: "none", border: "none", color: "#333",
    cursor: "pointer", fontSize: 14, padding: "8px",
    fontFamily: "'DM Mono',monospace",
  },
  editForm: { display: "flex", flexDirection: "column", gap: 16 },
  editHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 4 },
  editName: { fontSize: 15, fontWeight: 700 },
  editActions: { display: "flex", gap: 8 },
  cancelBtn: {
    flex: 1, padding: "10px", background: "transparent",
    border: "1px solid #222", borderRadius: 8,
    color: "#555", cursor: "pointer", fontSize: 12,
    fontFamily: "'DM Mono',monospace",
  },
  saveHabitBtn: {
    flex: 2, padding: "10px", background: "#FF3333",
    border: "none", borderRadius: 8, color: "#fff",
    fontSize: 12, fontWeight: 700, cursor: "pointer",
    fontFamily: "'DM Mono',monospace",
  },
  deleteConfirm: { display: "flex", flexDirection: "column", gap: 12 },
  deleteQuestion: { fontSize: 15, fontWeight: 700 },
  deleteNote: { fontSize: 12, color: "#555" },
  deleteActions: { display: "flex", gap: 8 },
  deleteBtn: {
    flex: 1, padding: "10px", background: "#1a0505",
    border: "1px solid #3a1010", borderRadius: 8,
    color: "#FF6666", cursor: "pointer", fontSize: 12,
    fontFamily: "'DM Mono',monospace",
  },
  red: { color: "#FF3333" },
  stars: { display: "flex", alignItems: "center", gap: 4 },
  starBtn: {
    background: "none", border: "none", fontSize: 28,
    cursor: "pointer", padding: "2px", lineHeight: 1,
    transition: "color 0.15s",
  },
  ratingLabel: { fontSize: 11, color: "#666", letterSpacing: "1px", marginLeft: 8 },
  textarea: {
    width: "100%", padding: "12px 14px", background: "#0a0a0a",
    border: "1px solid #222", borderRadius: 8, color: "#e8e8e0",
    fontSize: 14, fontFamily: "'DM Mono',monospace",
    outline: "none", resize: "vertical", lineHeight: 1.7,
  },
  feedbackSuccess: { textAlign: "center", padding: "16px 0" },
  feedbackError: { fontSize: 12, color: "#FF6666", letterSpacing: "1px" },
  dangerRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  dangerTitle: { fontSize: 14, fontWeight: 700, marginBottom: 4 },
  dangerSub: { fontSize: 12, color: "#555" },
  signOutBtn: {
    padding: "10px 16px", background: "transparent",
    border: "1px solid #333", borderRadius: 8,
    color: "#666", fontSize: 12, cursor: "pointer",
    fontFamily: "'DM Mono',monospace",
  },
  empty: { textAlign: "center", color: "#444", fontSize: 13, padding: "24px 0" },
  version: {
    textAlign: "center", fontSize: 11, color: "#2a2a2a",
    letterSpacing: "2px", paddingBottom: 16,
  },
};