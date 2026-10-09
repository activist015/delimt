# Delimt Android foundation

This is the first Android data layer, not an installable APK. App screens,
Expo/EAS configuration, and the native Android protection service still need
to be built. The existing web app stays in `src/`; this directory adds no
production routes or dependencies to it.

Each habit owns its reason in the existing Supabase `habits.why` column. Profile,
Home, in-app intervention, and the native overlay must all read that same
record. There is no shared profile reason and no database migration is needed
for this change.

`createHabitRepository(authenticatedSupabaseClient)` lists the signed-in user's
habits and saves one reason by habit ID. It reports errors to the caller so the
UI can keep an unsaved edit visible. Ownership filters complement Supabase row
level security; production must verify the actual RLS policies separately.

Android app selections will store package-name-to-habit-ID bindings. Use
`habitForApp` to resolve the current habit, then `interventionHabit` to prepare
the existing AI endpoint's habit payload. Missing bindings, deleted habits,
and bindings belonging to another account return no habit; show setup instead
of choosing the first habit or using an unrelated reason.

When saving, replace only the returned habit in screen state and refresh the
native protection configuration for apps bound to that habit. Clear those
bindings and cached reasons on sign-out or account switching. Do not put a
Groq key or a Supabase service-role key in the mobile app. Backend authentication
and native permission flows are prerequisites for a production APK.

Reasons missing from existing records display an “Add your reason” action;
never invent personal motivation. New edits accept up to 140 characters,
matching the current design editor. Legacy records are read without truncation.

Run the dependency-free data checks from the repository root:

```sh
node --test mobile/tests/habits.test.js
```

These tests verify habit selection, reason isolation, error handling, and query
scoping with an in-memory adapter. They do not claim live Supabase, AI, native
blocking, or APK build verification.
