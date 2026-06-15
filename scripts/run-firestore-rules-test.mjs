import fs from "node:fs";
import { spawn } from "node:child_process";
import process from "node:process";

const projectId = "demo-site-convidados-rules";
const testScript = process.argv[2] ?? "scripts/test-firestore-rules-baseline.mjs";

if (
  !testScript.startsWith("scripts/") ||
  testScript.includes('"') ||
  !fs.existsSync(testScript)
) {
  console.error(`Invalid Firestore rules test script: ${testScript}`);
  process.exit(1);
}

const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
const env = { ...process.env };
const sensitiveEnvName =
  /(^|_)(API_KEY|ACCESS_TOKEN|CLIENT_SECRET|PAT_TOKEN|PASSWORD|SECRET|TOKEN)$/i;

for (const key of Object.keys(env)) {
  if (
    key === "DEBUG" ||
    sensitiveEnvName.test(key) ||
    /^(APS|FIRECRAWL|GITHUB|PINECONE|STITCH|SUPABASE|VERCEL)_/i.test(key)
  ) {
    delete env[key];
  }
}

const firebaseArgs = [
  "--yes",
  "firebase-tools@14.22.0",
  "emulators:exec",
  "--only",
  "firestore",
  `node ${testScript}`,
  "--project",
  projectId,
];

const quoteForCmd = (value) => `"${String(value).replaceAll('"', '\\"')}"`;
const cmdArg = (value) => (String(value).includes(" ") ? quoteForCmd(value) : value);
const command =
  process.platform === "win32" ? "powershell.exe" : npxCommand;
const args =
  process.platform === "win32"
    ? [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        `$env:DEBUG=$null; ${[npxCommand, ...firebaseArgs].map(cmdArg).join(" ")}`,
      ]
    : firebaseArgs;

const child = spawn(
  command,
  args,
  {
    env,
    shell: false,
    stdio: "inherit",
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`firebase-tools exited with signal ${signal}`);
    process.exit(1);
  }

  process.exit(code ?? 1);
});
