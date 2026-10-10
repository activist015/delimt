import { readFile, writeFile, access } from "node:fs/promises";
import { resolve } from "node:path";

// Reuse public web-client settings. Never copy a Groq or service-role key.
const output = resolve(".env");
try {
  await access(output);
  console.log("mobile/.env already exists; kept your settings.");
  process.exit(0);
} catch {}
const values = { ...process.env };
for (const path of ["../.env", "../.env.local", "../.env.development.local"]) {
  try {
    const text = await readFile(resolve(path), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(
        /^\s*(?:export\s+)?([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/,
      );
      if (
        !match ||
        ![
          "VITE_SUPABASE_URL",
          "VITE_SUPABASE_ANON_KEY",
          "EXPO_PUBLIC_SUPABASE_URL",
          "EXPO_PUBLIC_SUPABASE_ANON_KEY",
        ].includes(match[1])
      )
        continue;
      let value = match[2];
      if (/^["']/.test(value) && value.at(-1) === value[0])
        value = value.slice(1, -1);
      if (!values[match[1]]) values[match[1]] = value;
    }
  } catch {}
}
const url = values.EXPO_PUBLIC_SUPABASE_URL || values.VITE_SUPABASE_URL;
const key =
  values.EXPO_PUBLIC_SUPABASE_ANON_KEY || values.VITE_SUPABASE_ANON_KEY;
if (
  !url ||
  !key ||
  !/^https:\/\//.test(url) ||
  /your_supabase/i.test(url + key)
) {
  console.log(
    "Public Supabase settings were not found. You can still use Explore the design.",
  );
  console.log(
    "For real sign-in, copy .env.example to .env and enter the same public URL and anon key used by the web app.",
  );
  process.exit(0);
}
let privileged = key.startsWith("sb_secret_");
try {
  privileged ||=
    JSON.parse(Buffer.from(key.split(".")[1], "base64url")).role ===
    "service_role";
} catch {}
if (privileged)
  throw new Error("Use the public anon/publishable key, not a server key.");
await writeFile(
  output,
  `EXPO_PUBLIC_SUPABASE_URL=${url}\nEXPO_PUBLIC_SUPABASE_ANON_KEY=${key}\nEXPO_PUBLIC_API_URL=https://delimt.com\n`,
  { mode: 0o600 },
);
console.log(
  "mobile/.env is ready using your existing public web-client settings.",
);
