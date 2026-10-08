export const Icons = {
  DoomScrolling: ({ size = 24, color = "#e8e8e0" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2"/>
      <line x1="9" y1="7" x2="15" y2="7"/>
      <line x1="9" y1="11" x2="15" y2="11"/>
      <line x1="9" y1="15" x2="13" y2="15"/>
      <circle cx="12" cy="19" r="0.5" fill={color}/>
      {/* scroll indicator */}
      <path d="M17 9 L19 11 L17 13" strokeWidth="1.2"/>
    </svg>
  ),

  ImpulseBuying: ({ size = 24, color = "#e8e8e0" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
      {/* price tag */}
      <circle cx="17" cy="17" r="3" strokeWidth="1.2"/>
      <line x1="19" y1="15" x2="21" y2="13" strokeWidth="1.2"/>
    </svg>
  ),

  TextingEx: ({ size = 24, color = "#e8e8e0" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      {/* X over the message */}
      <line x1="9" y1="9" x2="15" y2="15" strokeWidth="1.8" stroke="#FF3333"/>
      <line x1="15" y1="9" x2="9" y2="15" strokeWidth="1.8" stroke="#FF3333"/>
    </svg>
  ),

  LateNightSnacking: ({ size = 24, color = "#e8e8e0" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 009 9 9 9 0 11-9-9z"/>
      {/* fork */}
      <line x1="18" y1="2" x2="18" y2="8"/>
      <line x1="16" y1="2" x2="16" y2="5"/>
      <line x1="20" y1="2" x2="20" y2="5"/>
      <line x1="18" y1="8" x2="18" y2="12"/>
    </svg>
  ),

  Procrastinating: ({ size = 24, color = "#e8e8e0" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
      {/* pause bars */}
      <line x1="9" y1="3.5" x2="9" y2="1" strokeWidth="2.5" stroke="#FF3333"/>
      <line x1="15" y1="3.5" x2="15" y2="1" strokeWidth="2.5" stroke="#FF3333"/>
    </svg>
  ),

  Custom: ({ size = 24, color = "#e8e8e0" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),

  History: ({ size = 24, color = "#e8e8e0" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3h7v7H3z"/>
      <path d="M14 3h7v7h-7z"/>
      <path d="M3 14h7v7H3z"/>
      <path d="M14 14h7v7h-7z"/>
    </svg>
  ),

  Settings: ({ size = 24, color = "#e8e8e0" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),

  Habits: ({ size = 24, color = "#e8e8e0" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),

  Resisted: ({ size = 24, color = "#4CAF50" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),

  GaveIn: ({ size = 24, color = "#FF6666" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
};

export const PRESET_HABITS = [
  { name: "Doom Scrolling",      icon: "DoomScrolling"      },
  { name: "Impulse Buying",      icon: "ImpulseBuying"      },
  { name: "Texting Ex",          icon: "TextingEx"          },
  { name: "Late Night Snacking", icon: "LateNightSnacking"  },
  { name: "Procrastinating",     icon: "Procrastinating"    },
];