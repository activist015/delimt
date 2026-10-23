import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ANDROID_BUILD_ID, ANDROID_DOWNLOAD_URL, isAndroidReleaseReady } from "../src/androidRelease.js";

const valid = { buildId: ANDROID_BUILD_ID, url: ANDROID_DOWNLOAD_URL, version: "1.0.0", byteSize: 123456789, sha256: "a".repeat(64) };

test("only the approved build's public APK link can become downloadable", () => {
  assert.equal(isAndroidReleaseReady(valid), true);
  for (const patch of [{ buildId: "another-build" }, { url: "https://expo.dev/private-build" },
    { url: "https://github.com/someone-else/delimt/releases/download/android-0beb0151/delimt-android.apk" }])
    assert.equal(isAndroidReleaseReady({ ...valid, ...patch }), false);
});
test("incomplete file metadata cannot expose an unverified download", () => {
  for (const patch of [{ version: null }, { byteSize: 0 }, { byteSize: -1 }, { byteSize: 1.5 },
    { byteSize: null }, { sha256: null }, { sha256: "not-a-checksum" }])
    assert.equal(isAndroidReleaseReady({ ...valid, ...patch }), false);
});
test("the repository contains either a complete release or a disabled placeholder", () => {
  const config = JSON.parse(readFileSync(new URL("../src/android-release.json", import.meta.url), "utf8"));
  if (config.url === null) {
    assert.equal(config.byteSize, null);
    assert.equal(config.sha256, null);
    assert.equal(isAndroidReleaseReady(config), false);
  } else assert.equal(isAndroidReleaseReady(config), true);
});
