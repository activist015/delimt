import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  createContext,
  useContext,
} from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  AppState,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Crypto from "expo-crypto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import { Manrope_400Regular } from "@expo-google-fonts/manrope/400Regular";
import { Manrope_500Medium } from "@expo-google-fonts/manrope/500Medium";
import { Manrope_600SemiBold } from "@expo-google-fonts/manrope/600SemiBold";
import { Manrope_700Bold } from "@expo-google-fonts/manrope/700Bold";
import { DMMono_400Regular } from "@expo-google-fonts/dm-mono/400Regular";
import { DMMono_500Medium } from "@expo-google-fonts/dm-mono/500Medium";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  CirclePause,
  House,
  Smartphone,
  ChartNoAxesColumnIncreasing,
  UserRound,
  ShoppingBag,
  Shield,
  Plus,
  X,
  MessageCircle,
  Pencil,
} from "lucide-react-native";
import Svg, { Path } from "react-native-svg";
import { configured, supabase } from "./src/lib/supabase";
import {
  createHabitRepository,
  MAX_REASON_LENGTH,
  validateReason,
} from "./src/data/habits";
import { dayKey, shiftDay, habitProgress } from "./src/data/progress";
import {
  loadEvents,
  requestIntervention,
  saveOutcome,
} from "./src/data/workspace";

const themes = {
  dark: {
    bg: "#0E100E",
    card: "#191C17",
    raised: "#242820",
    text: "#F2F1E8",
    muted: "#A0A69B",
    line: "#30362C",
    accent: "#FF4749",
    green: "#AFD5A8",
    greenBg: "#203A29",
    tint: "#382321",
    label: "#D5D8CB",
  },
  light: {
    bg: "#F5F3EC",
    card: "#FFFEF8",
    raised: "#E9EADF",
    text: "#20261E",
    muted: "#606858",
    line: "#D7DACF",
    accent: "#BE262D",
    green: "#2A683C",
    greenBg: "#E0EEDE",
    tint: "#F4E2DC",
    label: "#444D3D",
  },
};
const Theme = createContext(themes.dark);
const useTheme = () => useContext(Theme);
const text = StyleSheet.create({
  body: { fontFamily: "Manrope_500Medium", fontSize: 16, lineHeight: 25 },
  title: {
    fontFamily: "Manrope_700Bold",
    fontSize: 31,
    lineHeight: 39,
    letterSpacing: -1,
  },
  mono: { fontFamily: "DMMono_400Regular", fontSize: 10, letterSpacing: 1.9 },
  small: { fontFamily: "Manrope_400Regular", fontSize: 13, lineHeight: 20 },
});
const layout = StyleSheet.create({
  root: { flex: 1 },
  page: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32, gap: 24 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  between: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  field: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: "Manrope_500Medium",
    fontSize: 16,
  },
  card: { borderRadius: 24, padding: 22, gap: 16 },
  headline: {
    fontFamily: "Manrope_700Bold",
    fontSize: 42,
    lineHeight: 48,
    letterSpacing: -1.6,
  },
  number: {
    fontFamily: "DMMono_500Medium",
    fontSize: 88,
    lineHeight: 100,
    letterSpacing: -5,
  },
  nav: {
    flexDirection: "row",
    paddingTop: 12,
    paddingBottom: 6,
    borderTopWidth: 1,
  },
  navItem: { flex: 1, alignItems: "center", gap: 7, paddingVertical: 9 },
  modal: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  chat: { flex: 1, paddingHorizontal: 24 },
  tag: { borderRadius: 99, paddingVertical: 6, paddingHorizontal: 10 },
});

function Body({ children, muted = false, style, ...props }) {
  const t = useTheme();
  return (
    <Text
      {...props}
      style={[text.body, { color: muted ? t.muted : t.text }, style]}
    >
      {children}
    </Text>
  );
}
function Label({ children, color, style }) {
  const t = useTheme();
  return (
    <Text style={[text.mono, { color: color || t.muted }, style]}>
      {children}
    </Text>
  );
}
function Heading({ children, style }) {
  const t = useTheme();
  return <Text style={[text.title, { color: t.text }, style]}>{children}</Text>;
}
function Card({ children, style }) {
  const t = useTheme();
  return (
    <View style={[layout.card, { backgroundColor: t.card }, style]}>
      {children}
    </View>
  );
}
function Button({
  children,
  onPress,
  kind = "primary",
  disabled = false,
  icon: Icon,
  style,
  label,
}) {
  const t = useTheme();
  const bg =
    kind === "primary" ? t.accent : kind === "success" ? t.greenBg : t.raised;
  const color =
    kind === "primary" ? "#FFFFFF" : kind === "success" ? t.green : t.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        {
          minHeight: 54,
          paddingHorizontal: 18,
          paddingVertical: 14,
          borderRadius: 17,
          backgroundColor: bg,
          opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        },
        style,
      ]}
    >
      {Icon && <Icon size={19} color={color} />}
      <Text
        style={{
          fontFamily: "Manrope_700Bold",
          fontSize: 15,
          color,
          textAlign: "center",
        }}
      >
        {children}
      </Text>
    </Pressable>
  );
}
function Field({ label, style, ...props }) {
  const t = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <Label>{label}</Label>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor={t.muted}
        style={[
          layout.field,
          { backgroundColor: t.bg, borderColor: t.line, color: t.text },
          style,
        ]}
      />
    </View>
  );
}
function Notice({ children, error = false }) {
  const t = useTheme();
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        backgroundColor: error ? t.tint : t.raised,
        borderRadius: 16,
        padding: 15,
      }}
    >
      <Body style={text.small}>{children}</Body>
    </View>
  );
}
function Brand() {
  const t = useTheme();
  return (
    <View style={[layout.row, { gap: 2 }]}>
      <Svg width={29} height={32} viewBox="0 0 29 32">
        <Path
          d="M3 3V29H12C30 29 30 3 12 3Z"
          stroke={t.accent}
          strokeWidth={2.7}
          fill="none"
        />
      </Svg>
      <Text
        style={{
          fontFamily: "DMMono_500Medium",
          fontSize: 23,
          color: t.text,
          letterSpacing: -1,
        }}
      >
        elimt
      </Text>
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: t.accent,
          alignSelf: "flex-start",
          marginTop: 4,
          marginLeft: 2,
        }}
      />
    </View>
  );
}
function Entry({ children, entryKey }) {
  const value = useRef(new Animated.Value(1)).current;
  const [reduce, setReduce] = useState(true);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then(
      (v) => alive && setReduce(v),
    );
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduce,
    );
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  useEffect(() => {
    value.stopAnimation();
    value.setValue(reduce ? 1 : 0);
    if (!reduce)
      Animated.timing(value, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
  }, [entryKey, reduce, value]);
  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: value,
        transform: [
          {
            translateY: value.interpolate({
              inputRange: [0, 1],
              outputRange: [8, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

const previewUser = {
  id: "preview",
  email: "preview@delimt",
  user_metadata: { name: "Faisal Ibrahim" },
};
function exampleApp(habit) {
  return /buy|shop|cart|spend/i.test(habit?.name || "")
    ? "Jumia"
    : /scroll|social|instagram|tiktok/i.test(habit?.name || "")
      ? "Instagram"
      : "this app";
}
function previewData() {
  const habits = [
    {
      id: "scroll",
      user_id: "preview",
      name: "Doom scrolling",
      why: "I want my evenings back. More creating, less scrolling.",
      excuse: "Just five more minutes.",
      active: true,
    },
    {
      id: "shopping",
      user_id: "preview",
      name: "Impulse buying",
      why: "I want to keep money for what matters.",
      excuse: "It is on sale.",
      active: true,
    },
  ];
  const events = [];
  for (let offset = 0; offset < 8; offset++)
    for (const habit of habits) {
      const date = new Date();
      date.setDate(date.getDate() - offset);
      date.setHours(12, 0, 0, 0);
      if (date > new Date()) date.setHours(0, 0, 0, 0);
      events.push({
        id: `${habit.id}-${offset}`,
        habit_id: habit.id,
        user_id: "preview",
        outcome: "resisted",
        created_at: date.toISOString(),
      });
    }
  return { habits, events };
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    DMMono_400Regular,
    DMMono_500Medium,
  });
  const [session, setSession] = useState(null);
  const [booting, setBooting] = useState(Boolean(supabase));
  const [preview, setPreview] = useState(false);
  const [bootError, setBootError] = useState("");
  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    let authChanged = false;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      authChanged = true;
      if (alive) {
        setSession(next);
        setBooting(false);
      }
    });
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!alive || authChanged) return;
        if (error) setBootError(error.message);
        setSession(data.session);
        setBooting(false);
      })
      .catch(() => {
        if (alive) {
          setBootError("Could not restore sign-in. Please sign in again.");
          setBooting(false);
        }
      });
    const refresh = (state) =>
      state === "active"
        ? supabase.auth.startAutoRefresh()
        : supabase.auth.stopAutoRefresh();
    refresh(AppState.currentState);
    const listener = AppState.addEventListener("change", refresh);
    return () => {
      alive = false;
      subscription.unsubscribe();
      listener.remove();
      supabase.auth.stopAutoRefresh();
    };
  }, []);
  return (
    <SafeAreaProvider>
      <Theme.Provider value={themes.dark}>
        {(!fontsLoaded && !fontError) || booting ? (
          <SafeAreaView
            style={{
              flex: 1,
              backgroundColor: themes.dark.bg,
              justifyContent: "center",
            }}
          >
            <ActivityIndicator color={themes.dark.accent} />
          </SafeAreaView>
        ) : preview || session ? (
          <Workspace
            key={preview ? "preview" : session.user.id}
            user={preview ? previewUser : session.user}
            preview={preview}
            exitPreview={() => setPreview(false)}
          />
        ) : (
          <Auth onPreview={() => setPreview(true)} initialError={bootError} />
        )}
      </Theme.Provider>
    </SafeAreaProvider>
  );
}

function Auth({ onPreview, initialError }) {
  const t = useTheme();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(initialError);
  const [message, setMessage] = useState("");
  const lock = useRef(false);
  const submit = async () => {
    if (lock.current) return;
    setError("");
    setMessage("");
    if (!configured) {
      setError(
        "Add your public Supabase settings to sign in. Explore the design below works now.",
      );
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim()) || password.length < 6) {
      setError(
        "Enter a valid email and a password with at least 6 characters.",
      );
      return;
    }
    lock.current = true;
    setPending(true);
    try {
      const result =
        mode === "signup"
          ? await supabase.auth.signUp({
              email: email.trim(),
              password,
              options: { data: { name: name.trim() } },
            })
          : await supabase.auth.signInWithPassword({
              email: email.trim(),
              password,
            });
      if (result.error) throw result.error;
      if (mode === "signup" && !result.data.session)
        setMessage(
          "Check your email to confirm your account, then sign in here.",
        );
    } catch (e) {
      setError(e.message || "Could not sign in.");
    } finally {
      lock.current = false;
      setPending(false);
    }
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[layout.page, { paddingTop: 28 }]}
        >
          <Brand />
          <View style={{ paddingTop: 32, gap: 18 }}>
            <Label>A MOMENT TO CHOOSE</Label>
            <Heading style={{ fontSize: 42, lineHeight: 48 }}>
              Make room for{"\n"}what matters.
            </Heading>
            <Body muted>
              Pause the habit. Remember your reason. Choose your next move.
            </Body>
          </View>
          <Card>
            <Heading style={{ fontSize: 22 }}>
              {mode === "signin" ? "Welcome back." : "Start with your reason."}
            </Heading>
            {error ? <Notice error>{error}</Notice> : null}
            {message ? <Notice>{message}</Notice> : null}
            {mode === "signup" && (
              <Field
                label="YOUR NAME"
                value={name}
                onChangeText={setName}
                autoComplete="name"
                maxLength={60}
              />
            )}
            <Field
              label="EMAIL"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <Field
              label="PASSWORD"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              onSubmitEditing={submit}
            />
            <Button disabled={pending} onPress={submit}>
              {pending
                ? "Connecting…"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </Button>
            <Button
              kind="secondary"
              disabled={pending}
              onPress={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError("");
                setMessage("");
              }}
            >
              {mode === "signin"
                ? "Create an account"
                : "Use an existing account"}
            </Button>
          </Card>
          <Button kind="secondary" onPress={onPreview}>
            Explore the design
          </Button>
          <Body muted style={[text.small, { textAlign: "center" }]}>
            Preview uses sample activity. Your real account stays separate.
          </Body>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Workspace({ user, preview, exitPreview }) {
  const [theme, setTheme] = useState("dark");
  const system = useColorScheme();
  const t = themes[theme === "system" ? system || "dark" : theme];
  const initial = useMemo(
    () => (preview ? previewData() : { habits: [], events: [] }),
    [preview],
  );
  const [habits, setHabits] = useState(initial.habits),
    [events, setEvents] = useState(initial.events),
    [name, setName] = useState(user.user_metadata?.name || "");
  const [loaded, setLoaded] = useState(preview),
    [loading, setLoading] = useState(!preview),
    [error, setError] = useState(""),
    [screen, setScreen] = useState("home"),
    [tone, setTone] = useState("direct");
  const [selected, setSelected] = useState(initial.habits[0]?.id || null),
    [editor, setEditor] = useState(null),
    [intervention, setIntervention] = useState(null),
    [pause, setPause] = useState(false);
  const alive = useRef(true),
    reloadLock = useRef(false);
  const repository = useMemo(
    () => (supabase ? createHabitRepository(supabase) : null),
    [],
  );
  const prefKey = `delimt:preferences:${user.id}`;
  useEffect(() => {
    alive.current = true;
    AsyncStorage.getItem(prefKey).then((raw) => {
      if (!alive.current || !raw) return;
      try {
        const value = JSON.parse(raw);
        if (["dark", "light", "system"].includes(value.theme))
          setTheme(value.theme);
        if (["direct", "gentle"].includes(value.tone)) setTone(value.tone);
      } catch {}
    });
    return () => {
      alive.current = false;
    };
  }, [prefKey]);
  const preference = (patch) => {
    const next = { theme, tone, ...patch };
    setTheme(next.theme);
    setTone(next.tone);
    AsyncStorage.setItem(prefKey, JSON.stringify(next)).catch(() =>
      setError("Your preference could not be saved on this phone."),
    );
  };
  const reload = async () => {
    if (preview || reloadLock.current) return;
    reloadLock.current = true;
    setLoading(true);
    setError("");
    try {
      const [nextHabits, nextEvents, profile] = await Promise.all([
        repository.list(),
        loadEvents(supabase),
        supabase
          .from("profiles")
          .select("name")
          .eq("id", user.id)
          .maybeSingle(),
      ]);
      if (profile.error) throw profile.error;
      if (!alive.current) return;
      setHabits(nextHabits);
      setEvents(nextEvents);
      if (profile.data?.name) setName(profile.data.name);
      setSelected((id) =>
        nextHabits.some((h) => h.id === id) ? id : nextHabits[0]?.id || null,
      );
      setLoaded(true);
    } catch (e) {
      if (alive.current) setError(e.message || "Could not load your data.");
    } finally {
      reloadLock.current = false;
      if (alive.current) setLoading(false);
    }
  };
  useEffect(() => {
    reload();
  }, []);
  const habit = habits.find((h) => h.id === selected) || habits[0];
  const start = (h = habit) => {
    if (!h) return;
    setPause(false);
    setIntervention({ habit: h, id: Crypto.randomUUID() });
  };
  const finish = (event) =>
    setEvents((current) => [
      event,
      ...current.filter((e) => e.id !== event.id),
    ]);
  const openReason = (h) => setEditor({ kind: "reason", habit: h });
  const addHabit = () => setEditor({ kind: "new", id: Crypto.randomUUID() });
  const saveEditor = async (value) => {
    if (editor.kind === "name") {
      const next = value.name.trim();
      if (!next) throw new Error("Enter your name.");
      if (!preview) {
        const auth = await supabase.auth.getUser();
        if (auth.error || auth.data.user?.id !== user.id)
          throw new Error("Sign in again.");
        const result = await supabase
          .from("profiles")
          .update({ name: next })
          .eq("id", user.id)
          .select("name")
          .single();
        if (result.error) throw result.error;
      }
      if (alive.current) setName(next);
    } else if (editor.kind === "reason") {
      const why = validateReason(value.why);
      const updated = preview
        ? { ...editor.habit, why }
        : await repository.updateReason(editor.habit.id, why);
      if (alive.current)
        setHabits((current) =>
          current.map((h) => (h.id === updated.id ? updated : h)),
        );
    } else {
      const why = validateReason(value.why);
      const habitName = value.name.trim();
      if (!habitName) throw new Error("Enter a habit name.");
      let created = {
        id: editor.id,
        user_id: user.id,
        name: habitName,
        why,
        excuse: value.excuse.trim(),
        emoji: "",
        active: true,
      };
      if (!preview) {
        const auth = await supabase.auth.getUser();
        if (auth.error || auth.data.user?.id !== user.id)
          throw new Error("Sign in again.");
        const result = await supabase
          .from("habits")
          .insert(created)
          .select()
          .single();
        if (result.error) throw result.error;
        created = result.data;
      }
      if (alive.current) {
        setHabits((current) => [
          ...current.filter((h) => h.id !== created.id),
          created,
        ]);
        setSelected(created.id);
      }
    }
    if (alive.current) setEditor(null);
  };
  const signOut = async () => {
    if (preview) {
      exitPreview();
      return;
    }
    const result = await supabase.auth.signOut();
    if (result.error) setError(result.error.message);
  };
  return (
    <Theme.Provider value={t}>
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <StatusBar style={t === themes.dark ? "light" : "dark"} />
        <View
          style={[
            layout.between,
            { paddingHorizontal: 24, paddingVertical: 18 },
          ]}
        >
          <Brand />
          {preview ? (
            <Label color={t.accent}>PREVIEW</Label>
          ) : (
            <View style={layout.row}>
              <Shield size={17} color={t.muted} />
              <Label>YOUR SPACE</Label>
            </View>
          )}
        </View>
        {!loaded ? (
          <View style={[layout.page, { flex: 1, justifyContent: "center" }]}>
            {loading ? (
              <ActivityIndicator color={t.accent} />
            ) : (
              <>
                <Notice error>{error}</Notice>
                <Button onPress={reload}>Try again</Button>
              </>
            )}
          </View>
        ) : intervention ? (
          <Intervention
            key={intervention.id}
            session={intervention}
            preview={preview}
            tone={tone}
            onSaved={finish}
            close={() => setIntervention(null)}
            events={events}
          />
        ) : pause ? (
          <Pause
            habit={habit}
            appName={exampleApp(habit)}
            start={start}
            leave={() => setPause(false)}
          />
        ) : (
          <>
            <Entry entryKey={`${screen}:${selected}`}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={layout.page}
              >
                {error ? <Notice error>{error}</Notice> : null}
                {screen === "home" && (
                  <Home
                    name={name}
                    habit={habit}
                    habits={habits}
                    events={events}
                    select={setSelected}
                    start={start}
                    edit={openReason}
                    add={addHabit}
                    refresh={reload}
                    loading={loading}
                  />
                )}
                {screen === "apps" && (
                  <Apps habit={habit} previewPause={() => setPause(true)} />
                )}
                {screen === "progress" && (
                  <Progress
                    habit={habit}
                    events={events}
                    habits={habits}
                    select={setSelected}
                  />
                )}
                {screen === "profile" && (
                  <Profile
                    name={name}
                    user={user}
                    habits={habits}
                    edit={openReason}
                    editName={() => setEditor({ kind: "name" })}
                    add={addHabit}
                    theme={theme}
                    tone={tone}
                    preference={preference}
                    signOut={signOut}
                    preview={preview}
                  />
                )}
              </ScrollView>
            </Entry>
            <View style={[layout.nav, { borderColor: t.line }]}>
              {[
                ["home", "Home", House],
                ["apps", "Apps", Smartphone],
                ["progress", "Progress", ChartNoAxesColumnIncreasing],
                ["profile", "Profile", UserRound],
              ].map(([id, label, Icon]) => (
                <Pressable
                  key={id}
                  accessibilityRole="tab"
                  accessibilityLabel={label}
                  accessibilityState={{ selected: screen === id }}
                  onPress={() => setScreen(id)}
                  style={layout.navItem}
                >
                  <Icon size={23} color={screen === id ? t.accent : t.muted} />
                  <Text
                    style={{
                      fontFamily: "Manrope_600SemiBold",
                      fontSize: 11,
                      color: screen === id ? t.text : t.muted,
                    }}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
        {editor && (
          <Editor
            key={editor.kind + (editor.habit?.id || "")}
            editor={editor}
            name={name}
            save={saveEditor}
            close={() => setEditor(null)}
          />
        )}
      </SafeAreaView>
    </Theme.Provider>
  );
}

function HabitPicker({ habits, selected, select }) {
  const t = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}
    >
      {habits.map((h) => (
        <Pressable
          key={h.id}
          accessibilityRole="button"
          accessibilityState={{ selected: h.id === selected }}
          onPress={() => select(h.id)}
          style={[
            layout.tag,
            {
              backgroundColor: h.id === selected ? t.raised : t.card,
              paddingHorizontal: 16,
              paddingVertical: 11,
              borderWidth: 1,
              borderColor: h.id === selected ? t.line : "transparent",
            },
          ]}
        >
          <Body style={{ fontSize: 13 }}>{h.name}</Body>
        </Pressable>
      ))}
    </ScrollView>
  );
}
function Reason({ habit, edit }) {
  const t = useTheme();
  return (
    <View
      style={{
        borderLeftWidth: 2,
        borderLeftColor: t.accent,
        paddingLeft: 17,
        gap: 10,
      }}
    >
      <Label>YOUR REASON</Label>
      <Body>{habit.why || "Add your reason for this habit."}</Body>
      {edit && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit reason for ${habit.name}`}
          onPress={() => edit(habit)}
          style={{ paddingVertical: 5 }}
        >
          <Body muted style={text.small}>
            Edit this reason ↗
          </Body>
        </Pressable>
      )}
    </View>
  );
}
function Home({
  name,
  habit,
  habits,
  events,
  select,
  start,
  edit,
  add,
  refresh,
  loading,
}) {
  const t = useTheme();
  const progress = habit ? habitProgress(events, habit.id) : null;
  const hour = new Date().getHours();
  return (
    <>
      <View style={{ gap: 10 }}>
        <Label>
          {new Date()
            .toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })
            .toUpperCase()}
        </Label>
        <Heading>
          Good {hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening"}
          {name ? `, ${name.split(" ")[0]}` : ""}.
        </Heading>
        <Body muted>You get to choose what comes next.</Body>
      </View>
      {habit ? (
        <>
          <HabitPicker habits={habits} selected={habit.id} select={select} />
          <Card>
            <Label>{habit.name.toUpperCase()}</Label>
            <View>
              <Text style={[layout.number, { color: t.text }]}>
                {String(progress.current).padStart(2, "0")}
              </Text>
              <Body muted>
                day{progress.current === 1 ? "" : "s"} choosing differently
              </Body>
            </View>
            <Reason habit={habit} edit={edit} />
            <View
              style={[
                layout.between,
                { borderTopWidth: 1, borderColor: t.line, paddingTop: 17 },
              ]}
            >
              <Label>{progress.wins} LOGGED WINS</Label>
              <Label>BEST {progress.longest} DAYS</Label>
            </View>
          </Card>
          <Button icon={MessageCircle} onPress={() => start(habit)}>
            I’m feeling the urge
          </Button>
          <Body muted style={[text.small, { textAlign: "center" }]}>
            A pause is enough to start.
          </Body>
        </>
      ) : (
        <Card>
          <ShoppingBag size={30} color={t.accent} />
          <Heading style={{ fontSize: 24 }}>Start with one habit.</Heading>
          <Body muted>Give it a name and your own reason to pause it.</Body>
          <Button icon={Plus} onPress={add}>
            Add your first habit
          </Button>
        </Card>
      )}
      <View style={layout.between}>
        <Button kind="secondary" icon={Plus} onPress={add} style={{ flex: 1 }}>
          Add habit
        </Button>
        <Button
          kind="secondary"
          disabled={loading}
          onPress={refresh}
          style={{ flex: 1 }}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </View>
    </>
  );
}
function Apps({ habit, previewPause }) {
  const t = useTheme();
  const appName = exampleApp(habit);
  return (
    <>
      <Label>APPS / YOUR BOUNDARIES</Label>
      <Heading>A moment before{"\n"}autopilot.</Heading>
      <Card>
        <Shield size={28} color={t.muted} />
        <Heading style={{ fontSize: 23 }}>Protection isn’t enabled.</Heading>
        <Body muted>
          This build lets you try the pause screen. It does not block other apps
          on your phone.
        </Body>
      </Card>
      {habit && (
        <Card>
          <View style={layout.row}>
            <Smartphone size={25} color={t.text} />
            <View>
              <Body>{appName === "this app" ? "App pause" : appName}</Body>
              <Body muted style={text.small}>
                Example app for the pause preview
              </Body>
            </View>
          </View>
          <Body muted style={text.small}>
            The preview will use your selected habit: {habit.name}.
          </Body>
          <Button kind="secondary" onPress={previewPause}>
            Preview app pause
          </Button>
        </Card>
      )}
    </>
  );
}
function Pause({ habit, appName, start, leave }) {
  const t = useTheme();
  return (
    <Entry entryKey="pause">
      <ScrollView
        contentContainerStyle={[layout.page, { paddingTop: 30, gap: 30 }]}
      >
        <View style={layout.row}>
          <Smartphone size={26} color={t.text} />
          <View>
            <Body>
              {appName === "this app" ? "App pause" : appName} · Preview
            </Body>
            <Body muted style={text.small}>
              {habit?.name}
            </Body>
          </View>
        </View>
        <CirclePause size={49} color={t.accent} />
        <View style={{ gap: 15 }}>
          <Label>A MOMENT TO CHOOSE</Label>
          <Heading style={layout.headline}>
            Before you{"\n"}open {appName}.
          </Heading>
          <Body muted>
            This is a preview of the pause you’ll see when app protection is
            enabled.
          </Body>
        </View>
        {habit && <Reason habit={habit} />}
        <View style={{ gap: 12 }}>
          <Button icon={MessageCircle} onPress={() => start(habit)}>
            Talk to Delimt
          </Button>
          <Button kind="success" icon={ArrowLeft} onPress={leave}>
            Leave this app
          </Button>
          <Body muted style={[text.small, { textAlign: "center" }]}>
            Preview only. Other apps have not been opened or blocked.
          </Body>
        </View>
      </ScrollView>
    </Entry>
  );
}

function Progress({ habit, events, habits, select }) {
  const t = useTheme();
  const [day, setDay] = useState(null);
  useEffect(() => setDay(null), [habit?.id]);
  if (!habit)
    return (
      <>
        <Heading>Your progress starts here.</Heading>
        <Body muted>Add a habit, then record your first choice.</Body>
      </>
    );
  const p = habitProgress(events, habit.id);
  const today = dayKey(new Date());
  const keys = Array.from({ length: 21 }, (_, i) => shiftDay(today, i - 20));
  const filtered = events.filter(
    (e) => e.habit_id === habit.id && (!day || dayKey(e.created_at) === day),
  );
  return (
    <>
      <Label>PROGRESS / ONE DAY AT A TIME</Label>
      <Heading>Small choices.{"\n"}They add up.</Heading>
      <HabitPicker habits={habits} selected={habit.id} select={select} />
      <View style={{ flexDirection: "row", gap: 10 }}>
        {[
          ["Current", p.current],
          ["Best", p.longest],
          ["Wins", p.wins],
        ].map(([label, value]) => (
          <Card key={label} style={{ flex: 1, padding: 15, gap: 5 }}>
            <Text
              style={{
                fontFamily: "DMMono_500Medium",
                fontSize: 28,
                color: t.text,
              }}
            >
              {value}
            </Text>
            <Body muted style={text.small}>
              {label}
            </Body>
          </Card>
        ))}
      </View>
      <Card>
        <Label>THE LAST 21 DAYS</Label>
        {[0, 1, 2].map((row) => (
          <View key={row} style={{ flexDirection: "row", gap: 7 }}>
            {keys.slice(row * 7, row * 7 + 7).map((key) => (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={`${key}: ${p.days[key] || "no activity"}`}
                onPress={() => setDay(key === day ? null : key)}
                style={{
                  flex: 1,
                  aspectRatio: 1,
                  borderRadius: 8,
                  backgroundColor:
                    p.days[key] === "resisted"
                      ? t.greenBg
                      : p.days[key] === "gave_in"
                        ? t.tint
                        : t.raised,
                  borderWidth: key === day ? 2 : 0,
                  borderColor: t.text,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {p.days[key] === "resisted" ? (
                  <Check size={16} color={t.green} />
                ) : p.days[key] === "gave_in" ? (
                  <View
                    style={{
                      height: 4,
                      width: 10,
                      backgroundColor: t.accent,
                      borderRadius: 2,
                    }}
                  />
                ) : null}
              </Pressable>
            ))}
          </View>
        ))}
        <Body muted style={text.small}>
          ✓ Resisted · red mark: gave in · empty: no activity
        </Body>
      </Card>
      <View style={layout.between}>
        <Label>{day ? `ACTIVITY / ${day}` : "RECENT ACTIVITY"}</Label>
        {day && (
          <Pressable accessibilityRole="button" onPress={() => setDay(null)}>
            <Body style={text.small}>Show all</Body>
          </Pressable>
        )}
      </View>
      {filtered.length ? (
        filtered.slice(0, 20).map((e) => (
          <View
            key={e.id}
            style={[
              layout.between,
              {
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderColor: t.line,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Body>{habit.name}</Body>
              <Body muted style={text.small}>
                {new Date(e.created_at).toLocaleString("en-GB", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Body>
            </View>
            <Text
              style={{
                fontFamily: "Manrope_600SemiBold",
                fontSize: 12,
                color: e.outcome === "resisted" ? t.green : t.muted,
              }}
            >
              {e.outcome === "resisted"
                ? "✓ Resisted"
                : e.outcome === "gave_in"
                  ? "Gave in"
                  : "Unfinished"}
            </Text>
          </View>
        ))
      ) : (
        <Body muted>No activity logged{day ? " on this day" : " yet"}.</Body>
      )}
      {filtered.length > 20 && (
        <Body muted style={text.small}>
          Showing the latest 20 entries. Your totals include your full recorded
          history.
        </Body>
      )}
    </>
  );
}
function Profile({
  name,
  user,
  habits,
  edit,
  editName,
  add,
  theme,
  tone,
  preference,
  signOut,
  preview,
}) {
  const t = useTheme();
  const initials = (name || "Your space")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
  return (
    <>
      <Label>PROFILE / YOUR SPACE</Label>
      <View style={layout.row}>
        <View
          style={{
            width: 67,
            height: 67,
            borderRadius: 34,
            backgroundColor: t.tint,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontFamily: "DMMono_500Medium",
              fontSize: 23,
              color: t.accent,
            }}
          >
            {initials}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Heading style={{ fontSize: 26 }}>{name || "Your space"}</Heading>
          <Pressable
            accessibilityRole="button"
            onPress={editName}
            style={{ paddingVertical: 7 }}
          >
            <Body muted style={text.small}>
              Edit your name ↗
            </Body>
          </Pressable>
        </View>
      </View>
      <View style={{ gap: 13 }}>
        <Label>WHAT I’M MAKING ROOM FOR</Label>
        {habits.map((h) => (
          <Card key={h.id}>
            <View style={layout.between}>
              <Body style={{ fontFamily: "Manrope_700Bold" }}>{h.name}</Body>
              <Pencil size={17} color={t.muted} />
            </View>
            <Body>{h.why || "Add your own reason for this habit."}</Body>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Edit reason for ${h.name}`}
              onPress={() => edit(h)}
              style={{ paddingVertical: 9 }}
            >
              <Body muted style={text.small}>
                Edit this reason ↗
              </Body>
            </Pressable>
          </Card>
        ))}
        <Button kind="secondary" icon={Plus} onPress={add}>
          Add a habit
        </Button>
      </View>
      <View style={{ gap: 12 }}>
        <Label>APPEARANCE</Label>
        <Segments
          values={["dark", "light", "system"]}
          value={theme}
          change={(value) => preference({ theme: value })}
        />
      </View>
      <View style={{ gap: 12 }}>
        <Label>HOW DELIMT SPEAKS TO YOU</Label>
        <Segments
          values={["direct", "gentle"]}
          value={tone}
          change={(value) => preference({ tone: value })}
        />
        <Body muted style={text.small}>
          Clear and respectful in both modes.
        </Body>
      </View>
      <Card>
        <View style={layout.row}>
          <Shield size={21} color={t.muted} />
          <Heading style={{ fontSize: 19 }}>Privacy & account</Heading>
        </View>
        <Body muted style={text.small}>
          {preview
            ? "Sample account. No account data is being changed."
            : user.email}
        </Body>
        <Button
          kind="secondary"
          onPress={() => Linking.openURL("https://delimt.com/privacy")}
        >
          Privacy policy
        </Button>
        <Button
          kind="secondary"
          onPress={() => Linking.openURL("https://delimt.com/terms")}
        >
          Terms of use
        </Button>
      </Card>
      <Button kind="secondary" onPress={signOut}>
        {preview ? "Exit preview" : "Sign out"}
      </Button>
      <Label style={{ textAlign: "center" }}>
        DELIMT / ANDROID PREVIEW 0.1
      </Label>
    </>
  );
}
function Segments({ values, value, change }) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: t.card,
        borderRadius: 18,
        padding: 5,
        gap: 4,
      }}
    >
      {values.map((item) => (
        <Pressable
          key={item}
          accessibilityRole="button"
          accessibilityState={{ selected: item === value }}
          onPress={() => change(item)}
          style={{
            flex: 1,
            paddingVertical: 13,
            borderRadius: 13,
            backgroundColor: item === value ? t.raised : "transparent",
            alignItems: "center",
          }}
        >
          <Body style={{ fontSize: 14 }}>
            {item[0].toUpperCase() + item.slice(1)}
          </Body>
        </Pressable>
      ))}
    </View>
  );
}
function Editor({ editor, name, save, close }) {
  const t = useTheme();
  const [why, setWhy] = useState(editor.habit?.why || ""),
    [nextName, setName] = useState(
      editor.kind === "name"
        ? name
        : editor.kind === "new"
          ? "Impulse buying"
          : editor.habit?.name || "",
    ),
    [excuse, setExcuse] = useState("");
  const [pending, setPending] = useState(false),
    [error, setError] = useState("");
  const lock = useRef(false);
  const submit = async () => {
    if (lock.current) return;
    lock.current = true;
    setPending(true);
    setError("");
    try {
      await save({ why, name: nextName, excuse });
    } catch (e) {
      setError(e.message || "Could not save. Your edit is still here.");
    } finally {
      lock.current = false;
      setPending(false);
    }
  };
  return (
    <Modal
      transparent
      visible
      animationType="none"
      onRequestClose={() => !pending && close()}
    >
      <KeyboardAvoidingView
        style={layout.modal}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={{ maxHeight: "90%" }}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[layout.card, { backgroundColor: t.card }]}
          >
            <View style={layout.between}>
              <Heading style={{ fontSize: 24 }}>
                {editor.kind === "name"
                  ? "Your name"
                  : editor.kind === "new"
                    ? "One habit. Your reason."
                    : editor.habit.name}
              </Heading>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel editing"
                disabled={pending}
                onPress={close}
                style={{ padding: 10 }}
              >
                <X size={22} color={t.muted} />
              </Pressable>
            </View>
            {editor.kind !== "reason" && (
              <Field
                label={editor.kind === "name" ? "YOUR NAME" : "HABIT NAME"}
                value={nextName}
                onChangeText={setName}
                maxLength={60}
              />
            )}
            {editor.kind !== "name" && (
              <>
                <Body muted style={text.small}>
                  What are you making room for by changing this habit?
                </Body>
                <Field
                  label="YOUR REASON"
                  multiline
                  value={why}
                  onChangeText={setWhy}
                  maxLength={Math.max(
                    MAX_REASON_LENGTH,
                    editor.habit?.why?.length || 0,
                  )}
                  style={{ minHeight: 112, textAlignVertical: "top" }}
                />
                <Label>
                  {why.length}/{MAX_REASON_LENGTH}
                </Label>
              </>
            )}
            {editor.kind === "new" && (
              <Field
                label="YOUR USUAL EXCUSE (OPTIONAL)"
                value={excuse}
                onChangeText={setExcuse}
                maxLength={160}
              />
            )}
            {error ? <Notice error>{error}</Notice> : null}
            <Button disabled={pending} onPress={submit}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Intervention({ session, preview, tone, onSaved, close, events }) {
  const t = useTheme();
  const habit = session.habit;
  const started = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0),
    [messages, setMessages] = useState([]),
    [input, setInput] = useState(""),
    [pending, setPending] = useState(false),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [outcome, setOutcome] = useState(null);
  const [retryMessages, setRetry] = useState(null);
  const alive = useRef(true),
    chatLock = useRef(false),
    saveLock = useRef(false),
    controller = useRef(null),
    scroll = useRef(null),
    resultChoice = useRef(null);
  const format = (seconds) =>
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const ask = async (conversation) => {
    if (chatLock.current) return;
    chatLock.current = true;
    setPending(true);
    setError("");
    setRetry(null);
    controller.current = new AbortController();
    try {
      const reply = preview
        ? `You wanted this pause for a reason: “${habit.why || "your own choice"}” What could you do for the next two minutes instead?`
        : await requestIntervention(supabase, {
            habit,
            messages: conversation,
            tone,
            signal: controller.current.signal,
          });
      if (alive.current) {
        setMessages([...conversation, { role: "assistant", content: reply }]);
        setRetry(null);
      }
    } catch (e) {
      if (alive.current && e.name !== "AbortError") {
        setError(e.message);
        setRetry(conversation);
      }
    } finally {
      chatLock.current = false;
      if (alive.current) setPending(false);
    }
  };
  useEffect(() => {
    alive.current = true;
    const initial = {
      role: "user",
      content: `I am feeling the urge to return to ${habit.name}. Help me pause.`,
    };
    setMessages([initial]);
    ask([initial]);
    return () => {
      alive.current = false;
      controller.current?.abort();
    };
  }, []);
  useEffect(() => {
    if (outcome) return;
    const timer = setInterval(
      () => setElapsed(Math.floor((Date.now() - started.current) / 1000)),
      1000,
    );
    return () => clearInterval(timer);
  }, [outcome]);
  const send = () => {
    if (!input.trim() || chatLock.current || saveLock.current || retryMessages)
      return;
    const next = [...messages, { role: "user", content: input.trim() }];
    setInput("");
    setMessages(next);
    ask(next);
  };
  const complete = async (choice) => {
    if (saveLock.current) return;
    saveLock.current = true;
    setSaving(true);
    setError("");
    // Freeze the first outcome for ambiguous-network retries.
    resultChoice.current ||= choice;
    const chosen = resultChoice.current;
    controller.current?.abort();
    try {
      const event = preview
        ? {
            id: session.id,
            user_id: "preview",
            habit_id: habit.id,
            outcome: chosen,
            created_at: new Date().toISOString(),
          }
        : await saveOutcome(supabase, {
            id: session.id,
            habit,
            outcome: chosen,
            messages,
          });
      if (alive.current) {
        onSaved(event);
        setOutcome(chosen);
      }
    } catch (e) {
      if (alive.current)
        setError(
          `${e.message || "Could not save."} Your choice has not been confirmed. Retry saving to continue.`,
        );
    } finally {
      saveLock.current = false;
      if (alive.current) setSaving(false);
    }
  };
  const leave = () => {
    if (saving) return;
    close();
  };
  const p = habitProgress(events, habit.id);
  if (outcome)
    return (
      <Entry entryKey="outcome">
        <ScrollView contentContainerStyle={[layout.page, { paddingTop: 34 }]}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: outcome === "resisted" ? t.greenBg : t.raised,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {outcome === "resisted" ? (
              <Check size={33} color={t.green} />
            ) : (
              <Pencil size={29} color={t.muted} />
            )}
          </View>
          <Heading style={layout.headline}>
            {outcome === "resisted" ? "You held." : "Logged."}
          </Heading>
          <Body muted>
            {outcome === "resisted"
              ? "One small choice. More room for what matters."
              : "One choice doesn’t erase your effort. You can start again."}
          </Body>
          <Label>
            {format(elapsed)} /{" "}
            {preview ? "PREVIEW ACTIVITY" : "SAVED TO YOUR ACTIVITY"}
          </Label>
          {outcome === "resisted" && (
            <>
              <Card>
                <Brand />
                <Heading
                  style={{ fontSize: 31, lineHeight: 38, marginVertical: 8 }}
                >
                  The urge passed.{"\n"}I chose differently.
                </Heading>
                <Text
                  style={{
                    fontFamily: "DMMono_500Medium",
                    fontSize: 34,
                    color: t.text,
                  }}
                >
                  {p.current}-day streak
                </Text>
                <Label>DELIMT.COM</Label>
              </Card>
              <Body muted style={text.small}>
                Your habit and conversation stay private.
              </Body>
              <Button
                onPress={() =>
                  Share.share({
                    message: `The urge passed. I chose differently.\n${p.current}-day streak.\ndelimt.com`,
                  }).catch(() => setError("Could not open sharing."))
                }
              >
                Share win text
              </Button>
            </>
          )}
          {error ? <Notice error>{error}</Notice> : null}
          <Button kind="secondary" onPress={close}>
            Back to Home
          </Button>
        </ScrollView>
      </Entry>
    );
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[layout.between, { paddingHorizontal: 24, paddingBottom: 16 }]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Return to Home without logging an outcome"
          onPress={leave}
          style={{ padding: 8 }}
        >
          <ArrowLeft size={22} color={t.muted} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Label>A MOMENT FOR YOU</Label>
          <Body>{habit.name}</Body>
        </View>
        <Label>{format(elapsed)}</Label>
      </View>
      <ScrollView
        ref={scroll}
        keyboardShouldPersistTaps="handled"
        style={layout.chat}
        contentContainerStyle={{ gap: 18, paddingBottom: 24 }}
        onContentSizeChange={() =>
          scroll.current?.scrollToEnd({ animated: false })
        }
      >
        <Card>
          <Reason habit={habit} />
        </Card>
        {preview && (
          <Notice>Preview conversation. No AI request is sent.</Notice>
        )}
        {messages.slice(1).map((m, i) => (
          <View
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "94%",
              backgroundColor: m.role === "user" ? t.raised : t.card,
              padding: 18,
              borderRadius: 18,
              borderLeftWidth: m.role === "assistant" ? 2 : 0,
              borderColor: t.accent,
              gap: 8,
            }}
          >
            {m.role === "assistant" && <Label color={t.accent}>DELIMT</Label>}
            <Body>{m.content}</Body>
          </View>
        ))}
        {pending && (
          <View style={layout.row}>
            <ActivityIndicator color={t.accent} />
            <Body muted style={text.small}>
              Delimt is thinking…
            </Body>
          </View>
        )}
        {error && <Notice error>{error}</Notice>}
        {retryMessages && !resultChoice.current && (
          <Button
            kind="secondary"
            disabled={pending || saving}
            onPress={() => ask(retryMessages)}
          >
            Retry chat
          </Button>
        )}
      </ScrollView>
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: 16,
          gap: 12,
          borderTopWidth: 1,
          borderColor: t.line,
        }}
      >
        {!resultChoice.current && (
          <View style={layout.row}>
            <TextInput
              accessibilityLabel="Your message to Delimt"
              placeholder="What’s on your mind?"
              placeholderTextColor={t.muted}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={send}
              maxLength={1600}
              editable={!pending && !saving && !retryMessages}
              style={[
                layout.field,
                {
                  flex: 1,
                  borderColor: t.line,
                  color: t.text,
                  backgroundColor: t.card,
                },
              ]}
            />
            <Button
              label="Send message"
              icon={ArrowRight}
              onPress={send}
              disabled={
                !input.trim() || pending || saving || Boolean(retryMessages)
              }
              style={{ paddingHorizontal: 13 }}
            >
              Send
            </Button>
          </View>
        )}
        {resultChoice.current ? (
          <Button
            onPress={() => complete(resultChoice.current)}
            disabled={saving}
          >
            {saving ? "Saving your choice…" : "Retry saving your choice"}
          </Button>
        ) : (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button
              kind="secondary"
              onPress={() => complete("gave_in")}
              disabled={saving}
              style={{ flex: 1 }}
            >
              I gave in
            </Button>
            <Button
              kind="success"
              icon={Check}
              onPress={() => complete("resisted")}
              disabled={saving}
              style={{ flex: 1 }}
            >
              I resisted
            </Button>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
