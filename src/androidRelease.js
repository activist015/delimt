export const ANDROID_BUILD_ID = "0beb0151-e8fa-454b-8c18-9044b82b01d5";
export const ANDROID_DOWNLOAD_URL = "https://github.com/activist015/delimt/releases/download/android-0beb0151/delimt-android.apk";

export function isAndroidReleaseReady(value) {
  return value?.buildId === ANDROID_BUILD_ID &&
    value.url === ANDROID_DOWNLOAD_URL &&
    typeof value.version === "string" && value.version.trim().length > 0 &&
    Number.isSafeInteger(value.byteSize) && value.byteSize > 0 &&
    /^[a-f0-9]{64}$/.test(value.sha256 || "");
}

export function androidSizeLabel(value) {
  return Number.isSafeInteger(value) && value > 0
    ? `${new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(value / 1_000_000)} MB`
    : "Size available with the download";
}

