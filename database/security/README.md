# Delimt account privacy update

The owner approved these changes and both migrations were applied to the live
Delimt project on 21 October 2026. Supabase recorded these migration versions:

- `20261021140709_harden_profile_access`
- `20261021140748_private_waitlist_access`

The matching files in `supabase/migrations/` preserve the exact applied SQL.
Neither the source updater nor these repository files automatically execute SQL.

For a separate environment, apply the profile migration first, then the
waitlist migration from `supabase/migrations/`. Each contains role-based checks that must
pass in the same transaction. All synthetic fixtures roll back; no real users,
tokens, email sends, or customer records are used by the checks.

The changes make profiles readable only by their authenticated owner, allow
owners to edit their name and their own invitation claim, and keep referral
codes/counters under database control. Private trigger functions validate a
claim once and increment the inviter's count atomically. The existing welcome
marker remains editable only on the owner's profile for compatibility.

Raw waitlist rows cannot be read, updated, or deleted by browser/mobile roles.
The current landing page's INSERT-only record is preserved with limited input
columns and validation. The `founding` value is an existing checkout record,
not proof of a verified payment or an access entitlement. Payment verification
is a separate server responsibility.

Public landing-page counts come from `waitlist_stats`, which contains only
one aggregate row and has no email addresses. Private database triggers keep
the totals current. Service-role access used by server jobs is preserved.

Website code in the same patch retains invitation codes through email
confirmation, claims them after Google returns, and removes the browser's
cross-profile lookup/counter update. It also reads the new public aggregate
counts and removes the unused client-side waitlist mutation helper.

Validation completed: 27 profile access/referral checks and 16 waitlist
access/aggregate checks passed both locally and in the live migrations.
Live metadata confirms owner-only profile policies, blocked client counter
edits, private waitlist rows, matching aggregate counts and private trigger
functions with fixed search paths. Nine website referral tests passed, and
the five changed website modules compile. Native protection and mobile
authentication source are outside this patch. No APK rebuild is required.

The three database function advisor warnings are resolved. Supabase still
reports the separate Auth setting for leaked-password protection as disabled:
https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

Deploy the matching website changes so public counts read `waitlist_stats`.
This update is not a claim that all other public API routes or payment logic
have been audited.
