import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../AuthContext";
import { Icons, PRESET_HABITS } from "../icons";

export default function Dashboard({ onStartIntervention, onNewHabit, onHistory }) {
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [streaks, setStreaks] = useState({});
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [pendingPreset, setPendingPreset] = useState(null);
  const [why, setWhy] = useState("");
  const [excuse, setExcuse] = useState("");
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single();
    if (profile?.name) setName(profile.name);

    const { data: habitsData } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", user.id)
      .eq("active", true)
      .order("created_at");
    if (habitsData) setHabits(habitsData);

    const { data: streaksData } = await supabase
      .from("streaks")
      .select("*")
      .eq("user_id", user.id);
    if (streaksData) {
      const streakMap = {};
      streaksData.forEach((s) => { streakMap[s.habit_id] = s; });
      setStreaks(streakMap);
    }

    setLoading(false);
  };

  const addPresetHabit = (preset) => {
    setPendingPreset(preset);
    setWhy("");
    setExcuse("");
    setShowProfile(true);
  };

  const confirmHabit = async () => {
    if (!pendingPreset) return;
    const { data } = await supabase
      .from("habits")
      .insert({
        user_id: user.id,
        name: pendingPreset.name,
        emoji: pendingPreset.emoji || null,
        icon: pendingPreset.icon || null,
        why,
        excuse,
      })
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
    setShowProfile(false);
    setPendingPreset(null);
    loadData();
  };

  const renderHabitIcon = (habit) => {
    if (habit.icon && Icons[habit.icon]) {
      const Icon = Icons[habit.icon];
      return <Icon size={26} color="#FF3333" />;
    }
    return <span style={{ fontSize: 26 }}>{habit.emoji || "⚡"}</span>;
  };

  const renderPresetIcon = (preset) => {
    if (preset.icon && Icons[preset.icon]) {
      const Icon = Icons[preset.icon];
      return <Icon size={22} color="#FF3333" />;
    }
    return <span style={{ fontSize: 22 }}>{preset.emoji || "⚡"}</span>;
  };

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" :
    hour < 17 ? "Good afternoon" : "Good evening";

  if (loading) return (
    <div style={{
      textAlign: "center",
      color: "#FF3333",
      fontSize: 12,
      letterSpacing: "3px",
      paddingTop: 60,
    }}>
      LOADING...
    </div>
  );

  return (
    <div>
      {/* GREETING */}
      <div style={s.greeting}>
        <div style={s.greetingLabel}>
          {greeting},{" "}
          <span style={s.red}>{name || user?.email?.split("@")[0]}</span>
        </div>
        <div style={s.greetingSub}>
          {habits.length === 0
            ? "Add your first habit to fight."
            : `Fighting ${habits.length} habit${habits.length > 1 ? "s" : ""}. Stay strong.`
          }
        </div>
      </div>

      {/* ACTIVE HABITS */}
      {habits.length > 0 && (
        <div style={s.section}>
          <div style={s.sectionLabel}>YOUR HABITS</div>
          <div style={s.habitList}>
            {habits.map((habit) => {
              const streak = streaks[habit.id];
              return (
                <div key={habit.id} style={s.habitCard}>
                  <div style={s.habitLeft}>
                    <div style={s.habitIconWrap}>
                      {renderHabitIcon(habit)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={s.habitName}>{habit.name}</div>
                      <div style={s.habitStreak}>
                        🔥 {streak?.current_streak || 0} day streak
                      </div>
                      {habit.why && (
                        <div style={s.habitWhy}>"{habit.why}"</div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onStartIntervention(habit)}
                    style={s.fightBtn}
                  >
                    I need help
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ADD HABITS */}
      <div style={s.section}>
        <div style={s.sectionLabel}>
          {habits.length === 0 ? "WHAT ARE YOU FIGHTING?" : "ADD MORE"}
        </div>
        <div style={s.presetGrid}>
          {PRESET_HABITS.filter(
            (p) => !habits.find((h) => h.name === p.name)
          ).map((preset) => (
            <button
              key={preset.name}
              onClick={() => addPresetHabit(preset)}
              style={s.presetBtn}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "#FF3333"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "#1a1a1a"}
            >
              {renderPresetIcon(preset)}
              <span style={s.presetName}>{preset.name}</span>
              <span style={s.presetAdd}>+</span>
            </button>
          ))}

          {/* Custom habit */}
          <button
            onClick={onNewHabit}
            style={s.presetBtn}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = "#FF3333"}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = "#1a1a1a"}
          >
            <Icons.Custom size={22} color="#FF3333" />
            <span style={s.presetName}>Custom habit</span>
            <span style={s.presetAdd}>+</span>
          </button>
        </div>
      </div>

      {/* STATS */}
      {habits.length > 0 && (
        <div style={s.section}>
          <div style={s.statsRow}>
            <div style={s.statCard}>
              <div style={s.statNum}>
                {Object.values(streaks).reduce(
                  (a, streak) => a + (streak?.current_streak || 0), 0
                )}
              </div>
              <div style={s.statLabel}>Total streak days</div>
            </div>
            <div style={s.statCard}>
              <div style={s.statNum}>{habits.length}</div>
              <div style={s.statLabel}>Habits fighting</div>
            </div>
            <div style={s.statCard}>
              <div
                style={{ ...s.statNum, color: "#FF3333", cursor: "pointer" }}
                onClick={onHistory}
              >
                →
              </div>
              <div style={s.statLabel}>View history</div>
            </div>
          </div>
        </div>
      )}

      {/* HABIT PROFILE MODAL */}
      {showProfile && (
        <div style={m.overlay}>
          <div style={m.modal}>
            <div style={m.modalHeader}>
              <div style={m.modalIconWrap}>
                {pendingPreset?.icon && Icons[pendingPreset.icon]
                  ? (() => { const Icon = Icons[pendingPreset.icon]; return <Icon size={40} color="#FF3333" />; })()
                  : <span style={{ fontSize: 40 }}>{pendingPreset?.emoji}</span>
                }
              </div>
              <div style={m.modalTitle}>{pendingPreset?.name}</div>
              <div style={m.modalSub}>
                The more honest you are, the harder delimt fights for you.
              </div>
            </div>

            <div style={m.field}>
              <label style={m.fieldLabel}>WHY DO YOU WANT TO STOP?</label>
              <input
                value={why}
                onChange={(e) => setWhy(e.target.value)}
                placeholder="e.g. It makes me feel empty after"
                style={m.input}
                autoFocus
              />
            </div>

            <div style={m.field}>
              <label style={m.fieldLabel}>YOUR USUAL EXCUSE</label>
              <input
                value={excuse}
                onChange={(e) => setExcuse(e.target.value)}
                placeholder="e.g. Just 5 minutes won't hurt"
                style={m.input}
                onKeyDown={(e) => e.key === "Enter" && confirmHabit()}
              />
            </div>

            <div style={m.hint}>
              delimt will use your words against your worst moments.
            </div>

            <button onClick={confirmHabit} style={m.btn}>
              Arm delimt →
            </button>

            <button
              onClick={() => setShowProfile(false)}
              style={m.skipBtn}
            >
              Skip for now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  greeting: {
    marginBottom: 32,
    paddingBottom: 24,
    borderBottom: "1px solid #111",
  },
  greetingLabel: {
    fontSize: 22,
    fontWeight: 900,
    marginBottom: 8,
  },
  greetingSub: {
    fontSize: 13,
    color: "#666",
    lineHeight: 1.6,
  },
  red: { color: "#FF3333" },
  section: { marginBottom: 32 },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: "4px",
    color: "#FF3333",
    marginBottom: 16,
  },
  habitList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  habitCard: {
    background: "#0f0f0f",
    border: "1px solid #1a1a1a",
    borderRadius: 12,
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  habitLeft: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    flex: 1,
    minWidth: 0,
  },
  habitIconWrap: {
    width: 36,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  habitName: {
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 4,
  },
  habitStreak: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  habitWhy: {
    fontSize: 11,
    color: "#444",
    fontStyle: "italic",
    marginTop: 4,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 200,
  },
  fightBtn: {
    padding: "10px 16px",
    background: "#FF3333",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'DM Mono',monospace",
    letterSpacing: "1px",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  presetGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  presetBtn: {
    background: "#0f0f0f",
    border: "1px solid #1a1a1a",
    borderRadius: 10,
    padding: "14px 18px",
    display: "flex",
    alignItems: "center",
    gap: 14,
    cursor: "pointer",
    color: "#e8e8e0",
    fontFamily: "'DM Mono',monospace",
    textAlign: "left",
    transition: "border-color 0.2s",
  },
  presetName: {
    flex: 1,
    fontSize: 14,
    fontWeight: 600,
  },
  presetAdd: {
    fontSize: 18,
    color: "#FF3333",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
  },
  statCard: {
    background: "#0f0f0f",
    border: "1px solid #1a1a1a",
    borderRadius: 10,
    padding: "16px 12px",
    textAlign: "center",
  },
  statNum: {
    fontSize: 28,
    fontWeight: 900,
    color: "#e8e8e0",
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 10,
    color: "#444",
    letterSpacing: "1px",
  },
};

const m = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    background: "rgba(0,0,0,0.92)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  modal: {
    width: "100%",
    maxWidth: 600,
    background: "#0f0f0f",
    border: "1px solid #222",
    borderRadius: "16px 16px 0 0",
    padding: 32,
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  modalHeader: {
    textAlign: "center",
    marginBottom: 8,
  },
  modalIconWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    height: 52,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 900,
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 13,
    color: "#666",
    lineHeight: 1.6,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  fieldLabel: {
    fontSize: 10,
    letterSpacing: "3px",
    color: "#555",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    background: "#0a0a0a",
    border: "1px solid #222",
    borderRadius: 8,
    color: "#e8e8e0",
    fontSize: 14,
    fontFamily: "'DM Mono',monospace",
    outline: "none",
  },
  hint: {
    fontSize: 11,
    color: "#444",
    textAlign: "center",
    letterSpacing: "1px",
    fontStyle: "italic",
  },
  btn: {
    padding: "14px",
    background: "#FF3333",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'DM Mono',monospace",
    letterSpacing: "1px",
  },
  skipBtn: {
    background: "none",
    border: "none",
    color: "#444",
    cursor: "pointer",
    fontSize: 12,
    fontFamily: "'DM Mono',monospace",
    textAlign: "center",
    letterSpacing: "1px",
    paddingBottom: 8,
  },
};