# Delimt Android preview

This is now an Expo/React Native app with Home, Apps, Progress, Profile,
email/password sign-in, habit creation and reason editing, and the manual
intervention/outcome flow. It includes both themes and reduced-motion transitions.

## Open it on your phone

From the repository root in Codespaces:

```sh
cd mobile
npm ci
npm run configure
npx expo start --go --tunnel
```

Use current Expo Go on Android and open the terminal's `exp://` link. When
Codespaces is also on your phone, use the link rather than scanning a QR code
on that same phone. Dependencies are pinned for Expo SDK 57.

Choose **Explore the design** for the first screen test. Preview uses sample
activity, editable in-memory habits, and a labeled local conversation. It does
not contact Supabase or AI and never changes your real account.

## Connect your account

`npm run configure` reuses the public `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` from the root `.env`, `.env.local`,
`.env.development.local`, or Codespaces environment. It writes only public
client settings to the ignored `mobile/.env` and preserves an existing file.

If absent, copy `.env.example` to `.env`, add the same public project URL and
anon/publishable key as the web app, and restart Expo. Never put a Groq,
service-role, or other server secret in an `EXPO_PUBLIC_` value.

Existing email/password accounts can sign in. Sign-up displays the appropriate
email confirmation message. Google sign-in and account deletion are not yet
implemented in this preview.

## Connect live AI

The new root `api/mobile-intervene.js` and `server/mobile-intervention.js`
need deployment on the existing backend before live chat works. Importing
source into an Android branch does not deploy them. Missing configuration or
an endpoint returns a visible error, never a pretend AI reply.

The endpoint verifies the Supabase bearer token and queries the active habit
with both signed-in owner ID and habit ID. It reads the saved reason from
Supabase, not the request's editable habit payload. Groq stays on the server.

Backend settings: existing `GROQ_API_KEY` and either
`SUPABASE_URL`/`SUPABASE_ANON_KEY` or
`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`. `GROQ_MODEL` is optional.
Native requests do not require browser CORS. A comma-separated
`DELIMT_ALLOWED_ORIGINS` can explicitly allow a development web origin.

## Data and progress

Every habit keeps its reason in `habits.why`; archived habits are excluded.
Home, Profile, and that habit's intervention use the same record. No database
migration is introduced. A session keeps one UUID so an ambiguous-network
retry cannot add another win, and rewards appear only after a confirmed save.

History reads all pages for the current account. Android streaks are derived
from interventions using the phone's calendar timezone: several wins count
once per day, any lapse makes the day a lapse, and a full missed day breaks
the run. The web app's separate `streaks` table is not rewritten. A shared,
server-authoritative calculation and stable account timezone are still needed
before cross-platform release.

## Next stage and release limits

The Apps tab offers a labeled pause preview. This build does not inspect
installed apps, register an Accessibility Service, overlay another app, or
activate protection. Build the native blocker and permission onboarding after
the on-phone screen check. Native modules require a development build rather
than Expo Go. Win sharing currently shares text; image-card export is pending.

Before release, verify live RLS, backend deployment, expired sessions, account
and data deletion, shared streak rules, and API rate limits. The old web
`/api/intervene` still needs authentication and rate limits; this patch adds a
separate authenticated endpoint without changing the existing web flow.

## Checks and later APK builds

```sh
npm test
```

The 31 data/endpoint checks use controlled adapters. Android/web Metro exports,
Android prebuild, and interactive screen checks also pass. These are not a
claim of live Supabase/Groq testing, an EAS build, or physical-device blocking.

`eas.json` has APK profiles for later. Link the project to your own Expo
account before building. After the native blocker is ready, a preview APK can
use `npx eas-cli@latest build -p android --profile preview`.
No EAS project ID, credential, signing key, or completed APK is included.
