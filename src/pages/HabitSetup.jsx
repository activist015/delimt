import { useState } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../AuthContext";

export default function HabitSetup({ onDone, onClose }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("⚡");
  const [why, setWhy] = useState("");
  const [excuse, setExcuse] = useState("");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const { data } = await supabase
      .from("habits")
      .insert({ user_id: user.id, name, emoji, why, excuse })
      .select()
      .single();

    if (data) {
      await supabase.from("streaks").insert({
        user_id: user.id,
        habit_id: data.id,
        current_streak: 0,
        longest_streak: 0,
      });
    }
    setLoading(false);
    onDone();
  };

  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <div style={s.header}>
          <div style={s.label}>NEW HABIT</div>
          <button onClick={onClose} style={s.closeBtn}>✕</button>
        </div>

        <div style={s.field}>
          <label style={s.fieldLabel}>HABIT NAME</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Watching too much Netflix"
            style={s.input}
          />
        </div>

        <div style={s.field}>
          <label style={s.fieldLabel}>EMOJI</label>
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            placeholder="📱"
            style={{ ...s.input, width: 80 }}
          />
        </div>

        <div style={s.field}>
          <label style={s.fieldLabel}>WHY DO YOU WANT TO STOP?</label>
          <input
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            placeholder="e.g. It's killing my productivity"
            style={s.input}
          />
        </div>

        <div style={s.field}>
          <label style={s.fieldLabel}>YOUR USUAL EXCUSE</label>
          <input
            value={excuse}
            onChange={(e) => setExcuse(e.target.value)}
            placeholder="e.g. Just one more episode"
            style={s.input}
          />
        </div>

        <button onClick={save} disabled={loading || !name.trim()} style={s.btn}>
          {loading ? "..." : "Add Habit →"}
        </button>
      </div>
    </div>
  );
}

const s = {
  overlay: { position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "flex-end", justifyContent: "center" },
  modal: { width: "100%", maxWidth: 600, background: "#0f0f0f", border: "1px solid #222", borderRadius: "16px 16px 0 0", padding: 32, display: "flex", flexDirection: "column", gap: 20 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 10, letterSpacing: "4px", color: "#FF3333" },
  closeBtn: { background: "none", border: "none", color: "#555", fontSize: 18, cursor: "pointer" },
  field: { display: "flex", flexDirection: "column", gap: 8 },
  fieldLabel: { fontSize: 10, letterSpacing: "3px", color: "#555" },
  input: { width: "100%", padding: "12px 14px", background: "#0a0a0a", border: "1px solid #222", borderRadius: 8, color: "#e8e8e0", fontSize: 14, fontFamily: "'DM Mono',monospace", outline: "none" },
  btn: { padding: "14px", background: "#FF3333", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono',monospace", letterSpacing: "1px", marginTop: 8 },
};