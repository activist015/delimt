# Android landing redesign

The public homepage follows the approved warm dark design. Its primary action
opens `/download`, which retains the existing APK, release information, and
installation and Accessibility guide. `/app` continues to require sign-in.
The homepage remains accessible to signed-in visitors.

The pause-screen illustration is a labelled example, built in HTML and CSS.
The Scrolling and Shopping buttons switch its app and personal reason. It
does not run native protection or send messages to AI. FAQ disclosures work
without additional libraries. Entry and button animation respects reduced
motion. Fonts are the existing locally hosted Manrope files.

Existing free, Pro, and founding-member offers are on `/pricing`, linked from
the shared navigation and footer. Old `/#pricing` links redirect there. The
founding price, payment callback, and backend endpoints are retained. This
design update is not a payment-verification or entitlement audit, and no live
payment was used during verification.

## Apply from the original Codespace

Upload `delimt-landing-redesign.py` to the original repository root, then run:

```sh
cd /workspaces/delimt
python3 delimt-landing-redesign.py
```

The script fetches `main`, checks reviewed file baselines, prepares a separate
`delimt-landing-redesign` worktree on `website/landing-redesign`, runs the 12
existing download/referral checks and the production build, commits the
website files, pushes the branch, and opens a pull request. Merge the PR after
its checks pass to deploy through the existing Vercel integration.

`--prepare-only` writes the files without account access, build, commit, or
push. It still fetches the repository. Reruns reuse the worktree and PR. If
the design is already on main, the script exits without another update.
Conflicting source or unrelated worktree edits are preserved and reported.

This updater does not modify `src/android-release.json`, download/upload an
APK, run EAS, change signing keys, install new dependencies, run SQL, or alter
the original Android checkout. Existing locked dependencies may be installed
with `npm ci` if there is no reusable matching installation.
