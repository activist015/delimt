import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../AuthContext";
import { Icons } from "../icons";

export default function History({ onBack }) {
  const { user } = useAuth();
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const { data } = await supabase
      .from("interventions")
      .select("*, habits(name, emoji, icon)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) setInterventions(data);
    setLoading(false);
  };

  const filtered = interventions.filter((i) => {
    if (filter === "resisted") return i.outcome === "resisted";
    if (filter === "gave_in") return i.outcome === "gave_in";
    return true;
  });

  const stats = {
    total: interventions.length,
    resisted: interventions.filter((i) => i.outcome === "resisted").length,
    gaveIn: interventions.filter((i) => i.outcome === "gave_in").length,
  };

  const rate = stats.total > 0
    ? Math.round((stats.resisted / stats.total) * 100)
    : 0;

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getHabitIcon = (habit) => {
    if (habit?.icon && Icons[habit.icon]) {
      const Icon = Icons[habit.icon];
      return <Icon size={20} color="#FF3333" />;
    }
    return (
      <span style={{ fontSize: 20 }}>{habit?.emoji || "⚡"}</span>
    );
  };

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
      {/* HEADER */}
      <div style={s.header}>
        <button onClick={onBack} style={s.backBtn}>← Back</button>
        <div style={s.title}>HISTORY</div>
      </div>

      {/* STATS */}
      <div style={s.statsGrid}>
        <div style={s.statCard}>
          <div style={s.statNum}>{stats.total}</div>
          <div style={s.statLabel}>Total</div>
        </div>
        <div style={s.statCard}>
          <div style={{ ...s.statNum, color: "#4CAF50" }}>
            {stats.resisted}
          </div>
          <div style={s.statLabel}>Resisted</div>
        </div>
        <div style={s.statCard}>
          <div style={{ ...s.statNum, color: "#FF3333" }}>
            {rate}%
          </div>
          <div style={s.statLabel}>Success rate</div>
        </div>
      </div>

      {/* RATE BAR */}
      {stats.total > 0 && (
        <div style={s.rateBar}>
          <div style={s.rateTrack}>
            <div
              style={{
                ...s.rateFill,
                width: `${rate}%`,
                background: rate >= 70
                  ? "#4CAF50"
                  : rate >= 40
                  ? "#FF9900"
                  : "#FF3333",
              }}
            />
          </div>
          <div style={s.rateLabel}>
            {rate >= 70
              ? "Strong. Keep fighting."
              : rate >= 40
              ? "Getting there. Don't stop."
              : "Early days. Every rep counts."}
          </div>
        </div>
      )}

      {/* FILTER */}
      {interventions.length > 0 && (
        <div style={s.filterRow}>
          {[
            { id: "all", label: "All" },
            { id: "resisted", label: "Resisted" },
            { id: "gave_in", label: "Gave in" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                ...s.filterBtn,
                background: filter === f.id ? "#FF3333" : "transparent",
                color: filter === f.id ? "#fff" : "#555",
                border: filter === f.id
                  ? "1px solid #FF3333"
                  : "1px solid #222",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* LIST */}
      {filtered.length === 0 ? (
        <div style={s.empty}>
          {interventions.length === 0
            ? "No interventions yet.\nHit \"I need help\" when the urge strikes."
            : "No results for this filter."}
        </div>
      ) : (
        <div style={s.list}>
          <div style={s.sectionLabel}>
            {filtered.length} INTERVENTION{filtered.length !== 1 ? "S" : ""}
          </div>
          {filtered.map((item) => (
            <div key={item.id} style={s.item}>
              <div style={s.itemLeft}>
                <div style={s.itemIcon}>
                  {getHabitIcon(item.habits)}
                </div>
                <div>
                  <div style={s.itemName}>
                    {item.habits?.name || "Unknown habit"}
                  </div>
                  <div style={s.itemDate}>
                    {formatDate(item.created_at)}
                  </div>
                  {item.messages?.length > 0 && (
                    <div style={s.itemMessages}>
                      {item.messages.length} message{item.messages.length !== 1 ? "s" : ""} exchanged
                    </div>
                  )}
                </div>
              </div>
              <div style={{
                ...s.badge,
                background: item.outcome === "resisted"
                  ? "#0a1a0a"
                  : "#1a0505",
                border: `1px solid ${item.outcome === "resisted"
                  ? "#1a3a1a"
                  : "#3a1010"}`,
              }}>
                {item.outcome === "resisted" ? (
                  <div style={s.badgeInner}>
                    <Icons.Resisted size={11} />
                    <span style={{ color: "#4CAF50", fontSize: 11 }}>
                      Resisted
                    </span>
                  </div>
                ) : (
                  <div style={s.badgeInner}>
                    <Icons.GaveIn size={11} />
                    <span style={{ color: "#FF6666", fontSize: 11 }}>
                      Gave in
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* STREAK MOTIVATION */}
      {stats.total >= 5 && (
        <div style={s.motivationCard}>
          <div style={s.motivationText}>
            {rate >= 70
              ? `${stats.resisted} times you chose yourself. That's who you're becoming.`
              : `${stats.gaveIn} slips don't erase ${stats.resisted} wins. Keep going.`}
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  header: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 28,
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "#666",
    cursor: "pointer",
    fontSize: 13,
    fontFamily: "'DM Mono',monospace",
    letterSpacing: "1px",
  },
  title: {
    fontSize: 10,
    letterSpacing: "4px",
    color: "#FF3333",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: 10,
    marginBottom: 16,
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
    marginBottom: 6,
    color: "#e8e8e0",
  },
  statLabel: {
    fontSize: 10,
    color: "#444",
    letterSpacing: "1px",
  },
  rateBar: {
    marginBottom: 24,
  },
  rateTrack: {
    height: 4,
    background: "#1a1a1a",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 8,
  },
  rateFill: {
    height: "100%",
    borderRadius: 2,
    transition: "width 0.6s ease",
  },
  rateLabel: {
    fontSize: 11,
    color: "#444",
    letterSpacing: "1px",
    textAlign: "right",
  },
  filterRow: {
    display: "flex",
    gap: 8,
    marginBottom: 24,
  },
  filterBtn: {
    padding: "8px 16px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 11,
    fontFamily: "'DM Mono',monospace",
    letterSpacing: "1px",
    transition: "all 0.2s",
  },
  list: {},
  sectionLabel: {
    fontSize: 10,
    letterSpacing: "4px",
    color: "#FF3333",
    marginBottom: 16,
  },
  item: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 0",
    borderBottom: "1px solid #0f0f0f",
    gap: 12,
  },
  itemLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  itemIcon: {
    width: 36,
    height: 36,
    background: "#0f0f0f",
    border: "1px solid #1a1a1a",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  itemName: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 3,
    color: "#e8e8e0",
  },
  itemDate: {
    fontSize: 11,
    color: "#444",
    marginBottom: 2,
  },
  itemMessages: {
    fontSize: 10,
    color: "#333",
    letterSpacing: "1px",
  },
  badge: {
    borderRadius: 6,
    padding: "6px 10px",
    flexShrink: 0,
  },
  badgeInner: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    whiteSpace: "nowrap",
  },
  empty: {
    textAlign: "center",
    color: "#444",
    fontSize: 13,
    lineHeight: 1.9,
    paddingTop: 40,
    whiteSpace: "pre-line",
  },
  motivationCard: {
    marginTop: 32,
    padding: 20,
    background: "#0f0f0f",
    border: "1px solid #1a1a1a",
    borderRadius: 12,
    borderLeft: "3px solid #FF3333",
  },
  motivationText: {
    fontSize: 13,
    color: "#888",
    lineHeight: 1.7,
    fontStyle: "italic",
  },
};