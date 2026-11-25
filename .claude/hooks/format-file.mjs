// Hook PostToolUse (Write|Edit): quita espacios en blanco y pasa Prettier y ESLint por el archivo tocado.
// Sin dependencias externas (no requiere jq). Solo afecta a archivos dentro del proyecto.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const projectDir = path.resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd());

let input = {};
try {
  input = JSON.parse(readFileSync(0, "utf8") || "{}");
} catch {
  process.exit(0);
}

const target = input?.tool_input?.file_path;
if (!target) process.exit(0);

const file = path.resolve(target);
const rel = path.relative(projectDir, file);

// Fuera del proyecto o inexistente -> ignorar.
if (rel.startsWith("..") || path.isAbsolute(rel) || !existsSync(file)) process.exit(0);

// Carpetas que no se formatean.
const skipped = ["node_modules", ".next", "references", ".claude", ".agents", "public"];
if (rel.split(path.sep).some((part) => skipped.includes(part))) process.exit(0);

const ext = path.extname(file).toLowerCase();
const prettierExts = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".json", ".css", ".md", ".mdx"];
// En código se eliminan espacios al final de línea y líneas vacías (en .md se respeta el formato).
const compactExts = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".json", ".css"];
const eslintExts = [".ts", ".tsx", ".js", ".jsx", ".mjs"];

const run = (script, args) =>
  spawnSync(process.execPath, [path.join(projectDir, script), ...args], {
    cwd: projectDir,
    encoding: "utf8",
  });

if (compactExts.includes(ext)) {
  const original = readFileSync(file, "utf8");
  const compact =
    original
      .split(/\r?\n/)
      .map((line) => line.trimEnd())
      .filter((line) => line !== "")
      .join("\n") + "\n";
  if (compact !== original) writeFileSync(file, compact);
}

if (prettierExts.includes(ext)) {
  const res = run("node_modules/prettier/bin/prettier.cjs", ["--write", "--log-level", "warn", file]);
  if (res.status !== 0) {
    process.stderr.write(`Prettier falló en ${rel}:\n${res.stderr || res.stdout}`);
    process.exit(2);
  }
}

if (eslintExts.includes(ext)) {
  const res = run("node_modules/eslint/bin/eslint.js", ["--fix", file]);
  if (res.status !== 0) {
    process.stderr.write(`ESLint encontró problemas en ${rel}:\n${res.stdout}${res.stderr}`);
    process.exit(2);
  }
}

process.exit(0);
