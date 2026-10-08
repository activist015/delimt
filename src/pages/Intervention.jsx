import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../AuthContext";

export default function Intervention({ habit, onDone }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const [intensity, setIntensity] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const chatEndRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    startIntervention();
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const callAI = async (msgs) => {
    try {
      const res = await fetch("/api/intervene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: msgs,
          habit,
          intensity,
        }),
      });
      const data = await res.json();
      return data.reply || "Stay strong. You opened delimt for a reason.";
    } catch {
      return "Stay strong. You opened delimt for a reason.";
    }
  };

  const startIntervention = async () => {
    setLoading(true);
    const reply = await callAI([{
      role: "user",
      content: `I'm about to ${habit.name.toLowerCase()} right now. Intercept me.`,
    }]);
    setMessages([{ role: "assistant", content: reply }]);
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);
    setIntensity((i) => Math.min(i + 1, 5));
    const reply = await callAI(newMessages);
    setMessages([...newMessages, { role: "assistant", content: reply }]);
    setLoading(false);
  };

  const handleOutcome = async (result) => {
    clearInterval(timerRef.current);
    setOutcome(result);

    await supabase.from("interventions").insert({
      user_id: user.id,
      habit_id: habit.id,
      outcome: result,
      messages,
    });

    if (result === "resisted") {
      const { data: streak } = await supabase
        .from("streaks")
        .select("*")
        .eq("user_id", user.id)
        .eq("habit_id", habit.id)
        .single();

      if (streak) {
        const today = new Date().toISOString().split("T")[0];
        const lastDate = streak.last_resisted;
        const isConsecutive = lastDate &&
          new Date(today) - new Date(lastDate) <= 86400000;
        const newStreak = isConsecutive ? streak.current_streak + 1 : 1;

        await supabase.from("streaks").update({
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, streak.longest_streak),
          last_resisted: today,
          updated_at: new Date().toISOString(),
        }).eq("id", streak.id);
      }
    } else {
      await supabase.from("streaks").update({
        current_streak: 0,
        updated_at: new Date().toISOString(),
      })
        .eq("user_id", user.id)
        .eq("habit_id", habit.id);
    }
  };

  const formatTime = (sec) =>
    `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

  if (outcome) return (
    <div style={s.outcomeScreen}>
      {outcome === "resisted" ? (
        <>
          <div style={s.outcomeEmoji}>💪</div>
          <h2 style={s.outcomeTitle}>You held strong.</h2>
          <p style={s.outcomeSub}>
            That urge is gone. Your streak grows. This is how it's done.
          </p>
          <div style={s.outcomeTime}>
            Time in intervention: {formatTime(elapsed)}
          </div>
        </>
      ) : (
        <>
          <div style={s.outcomeEmoji}>📝</div>
          <h2 style={{ ...s.outcomeTitle, color: "#888" }}>Logged.</h2>
          <p style={s.outcomeSub}>
            No judgment. But we're noting this happened.
            Tomorrow you fight again.
          </p>
        </>
      )}
      <button onClick={onDone} style={s.doneBtn}>
        Back to dashboard →
      </button>
    </div>
  );

  return (
    <div>
      {/* HEADER */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <span style={{ fontSize: 24 }}>{habit.emoji}</span>
          <div>
            <div style={s.headerLabel}>INTERVENING</div>
            <div style={s.headerName}>{habit.name}</div>
          </div>
        </div>
        <div style={s.timer}>{formatTime(elapsed)}</div>
      </div>

      {/* INTENSITY BAR */}
      <div style={s.intensityRow}>
        <span style={s.intensityLabel}>INTENSITY</span>
        <div style={s.intensityDots}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{
              ...s.dot,
              background: i <= intensity ? "#FF3333" : "#222",
            }} />
          ))}
        </div>
      </div>

      {/* CHAT */}
      <div style={s.chat}>
        {messages.length === 0 && loading && (
          <div style={s.loadingMsg}>Engaging intervention...</div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            marginBottom: 16,
          }}>
            <div style={{
              maxWidth: "85%",
              padding: "12px 16px",
              borderRadius: m.role === "user"
                ? "12px 12px 4px 12px"
                : "12px 12px 12px 4px",
              background: m.role === "user"
                ? "#1a1a1a"
                : "rgba(255,51,51,0.08)",
              border: m.role === "user"
                ? "1px solid #2a2a2a"
                : "1px solid rgba(255,51,51,0.25)",
              fontSize: 14,
              lineHeight: 1.7,
              color: m.role === "user" ? "#888" : "#e8e8e0",
            }}>
              {m.role === "assistant" && (
                <div style={s.aiLabel}>⚡ DELIMT</div>
              )}
              {m.content}
            </div>
          </div>
        ))}

        {loading && messages.length > 0 && (
          <div style={{ display: "flex", gap: 4, padding: "4px 0 8px" }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "#FF3333",
                animation: `bounce 0.8s ease ${i * 0.15}s infinite`,
              }} />
            ))}
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* INPUT */}
      <div style={s.inputRow}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Make your case..."
          style={s.input}
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            ...s.sendBtn,
            opacity: loading || !input.trim() ? 0.5 : 1,
          }}
        >
          →
        </button>
      </div>

      {/* OUTCOME BUTTONS */}
      <div style={s.outcomeRow}>
        <button
          onClick={() => handleOutcome("gave_in")}
          style={s.gaveInBtn}
        >
          I gave in
        </button>
        <button
          onClick={() => handleOutcome("resisted")}
          style={s.resistedBtn}
        >
          ✓ I resisted
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

const s = {
  header: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: 16,
    padding: "14px 18px", background: "#0f0f0f",
    border: "1px solid #1a1a1a", borderRadius: 12,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  headerLabel: {
    fontSize: 9, letterSpacing: "3px",
    color: "#FF3333", marginBottom: 4,
  },
  headerName: { fontSize: 15, fontWeight: 700 },
  timer: {
    fontSize: 20, fontWeight: 700,
    color: "#FF3333", fontVariantNumeric: "tabular-nums",
  },
  intensityRow: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16, padding: "0 4px",
  },
  intensityLabel: { fontSize: 9, letterSpacing: "3px", color: "#444" },
  intensityDots: { display: "flex", gap: 6 },
  dot: {
    width: 8, height: 8,
    borderRadius: "50%", transition: "background 0.3s",
  },
  chat: {
    background: "#0a0a0a", border: "1px solid #111",
    borderRadius: 12, padding: 16,
    minHeight: 280, maxHeight: 360,
    overflowY: "auto", marginBottom: 12,
  },
  loadingMsg: {
    color: "#333", fontSize: 12,
    letterSpacing: "2px", textAlign: "center",
    paddingTop: 40,
    animation: "pulse 1.5s ease infinite",
  },
  aiLabel: {
    fontSize: 9, color: "#FF3333",
    letterSpacing: "3px", marginBottom: 6,
  },
  inputRow: { display: "flex", gap: 8, marginBottom: 10 },
  input: {
    flex: 1, padding: "12px 14px",
    background: "#0f0f0f", border: "1px solid #222",
    borderRadius: 8, color: "#e8e8e0",
    fontSize: 14, fontFamily: "'DM Mono',monospace",
    outline: "none",
  },
  sendBtn: {
    padding: "12px 18px", background: "#FF3333",
    border: "none", borderRadius: 8,
    color: "#fff", fontSize: 18,
    cursor: "pointer", fontFamily: "'DM Mono',monospace",
    fontWeight: 700, transition: "opacity 0.2s",
  },
  outcomeRow: { display: "flex", gap: 8 },
  gaveInBtn: {
    flex: 1, padding: "12px",
    background: "transparent", border: "1px solid #222",
    borderRadius: 8, color: "#444",
    cursor: "pointer", fontSize: 13,
    fontFamily: "'DM Mono',monospace",
  },
  resistedBtn: {
    flex: 1, padding: "12px",
    background: "#0a1a0a", border: "1px solid #1a3a1a",
    borderRadius: 8, color: "#4CAF50",
    cursor: "pointer", fontSize: 13,
    fontFamily: "'DM Mono',monospace", fontWeight: 700,
  },
  outcomeScreen: { textAlign: "center", padding: "60px 24px" },
  outcomeEmoji: { fontSize: 64, marginBottom: 24 },
  outcomeTitle: {
    fontSize: 28, fontWeight: 900,
    color: "#e8e8e0", marginBottom: 12,
  },
  outcomeSub: {
    fontSize: 14, color: "#666",
    lineHeight: 1.8, maxWidth: 320,
    margin: "0 auto 24px",
  },
  outcomeTime: {
    fontSize: 12, color: "#444",
    letterSpacing: "2px", marginBottom: 32,
  },
  doneBtn: {
    padding: "14px 28px", background: "#FF3333",
    border: "none", borderRadius: 8,
    color: "#fff", fontSize: 14,
    fontWeight: 700, cursor: "pointer",
    fontFamily: "'DM Mono',monospace", letterSpacing: "1px",
  },
};