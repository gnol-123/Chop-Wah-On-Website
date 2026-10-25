import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const dir = "public/models";
const bin = join("node_modules", ".bin", process.platform === "win32" ? "gltf-transform.cmd" : "gltf-transform");
const run = (...args) => execFileSync(bin, args, { stdio: "inherit", shell: process.platform === "win32" });

for (const f of readdirSync(dir)) {
  if (!f.endsWith(".glb") || f.endsWith(".low.glb")) continue;
  const out = join(dir, f.replace(/\.glb$/, ".low.glb"));
  run("optimize", join(dir, f), out, "--compress", "meshopt", "--texture-compress", "webp", "--texture-size", "1024");
  run("validate", out); // exits non-zero on errors
}
