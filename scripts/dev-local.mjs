import { cp, copyFile, mkdtemp, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const temp = await mkdtemp(join(tmpdir(), "007-intelligence-lab-local-"));
const port = process.env.PORT || "8788";
const cleanup = async () => { await rm(temp, { recursive: true, force: true }); };
try {
  await cp(join(root, "public"), join(temp, "public"), { recursive: true });
  await cp(join(root, "functions"), join(temp, "functions"), { recursive: true });
  if (existsSync(join(root, ".dev.vars"))) await copyFile(join(root, ".dev.vars"), join(temp, ".dev.vars"));
  await writeFile(join(temp, "wrangler.toml"), [
    'name = "007-intelligence-lab-local"',
    'pages_build_output_dir = "public"',
    'compatibility_date = "2026-11-06"',
    ''
  ].join("\n"), "utf8");
  const cli = join(root, "node_modules", "wrangler", "bin", "wrangler.js");
  const child = spawn(process.execPath, [cli, "pages", "dev", "public", "--ip", "127.0.0.1", "--port", port], {
    cwd: temp, env: process.env, stdio: "inherit"
  });
  const stop = () => child.kill("SIGINT");
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  child.once("exit", async (code) => {
    await cleanup();
    process.exitCode = code ?? 0;
  });
} catch (error) {
  await cleanup();
  throw error;
}
