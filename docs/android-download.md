# Android download publication

The website now has a public `/download` route and Android download links in
the landing page. iPhone and desktop visitors can keep using `/app`.
The page includes setup steps, Android Accessibility permission information,
restricted-setting help and public version, size and SHA-256 metadata.
It uses local Manrope fonts with their included license and respects reduced
motion. The download action is visible near the top on a phone.

## APK source and publication

The approved EAS build is:
https://expo.dev/accounts/delimt/projects/delimt-android/builds/0beb0151-e8fa-454b-8c18-9044b82b01d5

This build's metadata requires the owner's Expo login. The standalone updater
reads it with `eas build:view <id> --json` inside the original Codespace's mobile
folder. It uses an installed EAS CLI or pinned `eas-cli@25.3.0`; this is a read,
not a new EAS build. It never reads or copies Expo/GitHub credentials itself.

The updater downloads the existing APK in Codespaces, checks its package,
version, bundled code, protection service and non-debuggable manifest, then
records the actual byte count and checksum. It publishes the binary unchanged
as an early-access GitHub release, verifies the uploaded asset's checksum and
checks the public link without login. A same-name existing asset with different
bytes is not overwritten. The APK is a release asset, not a large Git blob.

The intended release tag is `android-0beb0151`, with asset `delimt-android.apk`.
`src/android-release.json` is generated from the verified APK. Without complete
metadata the download button stays disabled. Never publish fabricated size,
version or checksum values.

Only the website files are committed in a separate worktree and branch. The
original Android checkout is preserved. The updater runs 12 download/referral
tests and a production Vite build, publishes the existing APK, then opens a PR
for the website. Merge the PR after checks pass for the existing Vercel setup
to deploy it. No database permissions or payment/subscription logic change.

Before running the updater, keep the original mobile folder available and use
the same Expo and GitHub accounts used to build and push Delimt. A stale Expo
login may require signing in again with the existing EAS CLI in that folder.

## Sources for installation guidance

- APK installation: https://docs.expo.dev/build-reference/apk/
- Android restricted settings: https://support.google.com/android/answer/12623953
- GitHub release creation: https://cli.github.com/manual/gh_release_create
- GitHub release publication: https://cli.github.com/manual/gh_release_edit

The existing privacy page is updated with factual Android permission and AI
processing information. This change does not implement account deletion or
data export in the app, and the policy uses the existing email request route.
