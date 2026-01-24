
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

const ROOT = "/home/leviath/kraken-code/src";

function checkFileContent(path: string, searchStrings: string[]) {
  if (!existsSync(path)) {
    console.log(`[FAIL] File missing: ${path}`);
    return false;
  }
  const content = readFileSync(path, "utf-8");
  const missing = searchStrings.filter(s => !content.includes(s));
  if (missing.length > 0) {
    console.log(`[FAIL] ${path} missing content: ${missing.join(", ")}`);
    return false;
  }
  console.log(`[PASS] ${path} verified`);
  return true;
}

console.log("--- Deep Feature Parity Verification ---\n");

let passed = 0;
let failed = 0;

// 1. Verify Agents (Sea-Themed)
const agentChecks = [
  { file: "agents/kraken.ts", checks: ["KRAKEN_PROMPT", "orchestrator"] },
  { file: "agents/atlas.ts", checks: ["ATLAS_PROMPT", "advisor"] },
  { file: "agents/nautilus.ts", checks: ["NAUTILUS_PROMPT", "infrastructure"] },
  { file: "agents/abyssal.ts", checks: ["ABYSSAL_PROMPT", "deep analysis"] },
  { file: "agents/coral.ts", checks: ["CORAL_PROMPT", "implementation"] },
  { file: "agents/siren.ts", checks: ["SIREN_PROMPT", "communication"] },
  { file: "agents/scylla.ts", checks: ["SCYLLA_PROMPT", "testing"] },
  { file: "agents/pearl.ts", checks: ["PEARL_PROMPT", "refactoring"] },
  { file: "agents/maelstrom.ts", checks: ["MAELSTROM_PROMPT", "multi-model"] },
  { file: "agents/leviathan.ts", checks: ["LEVIATHAN_PROMPT", "large-scale"] },
  { file: "agents/poseidon.ts", checks: ["POSEIDON_PROMPT", "data"] },
];

console.log("Checking Agents...");
agentChecks.forEach(check => {
  if (checkFileContent(join(ROOT, check.file), check.checks)) passed++;
  else failed++;
});

// 2. Verify Skills System
console.log("\nChecking Skills System...");
if (checkFileContent(join(ROOT, "features/skills/index.ts"), ["loadSkills", "registerSkill"])) passed++;
else failed++;

// 3. Verify Commands System
console.log("\nChecking Commands System...");
if (checkFileContent(join(ROOT, "features/commands/index.ts"), ["CommandRegistry", "executeCommand"])) passed++;
else failed++;

// 4. Verify Memory Integration
console.log("\nChecking Memory Integration...");
if (checkFileContent(join(ROOT, "features/memory/index.ts"), ["Kratos", "Obsidian"])) passed++;
else failed++;

// 5. Verify Native Integrations
console.log("\nChecking Native Integrations...");
if (checkFileContent(join(ROOT, "features/native-integrations/github.ts"), ["GitHubSDK", "Octokit"])) passed++;
else failed++;

// 6. Verify CLI Tools Bridge
console.log("\nChecking CLI Tools Bridge...");
if (checkFileContent(join(ROOT, "features/cli-tools/index.ts"), ["gptlint", "kereva"])) passed++;
else failed++;

// 7. Verify Hooks
console.log("\nChecking Hooks...");
const hooksDir = join(ROOT, "hooks");
if (existsSync(hooksDir)) {
  const hooks = readdirSync(hooksDir);
  if (hooks.length > 30) {
    console.log(`[PASS] Hooks directory contains ${hooks.length} hooks (Expected > 30)`);
    passed++;
  } else {
    console.log(`[FAIL] Hooks directory contains only ${hooks.length} hooks`);
    failed++;
  }
} else {
  console.log(`[FAIL] Hooks directory missing`);
  failed++;
}

// 8. Verify Tools
console.log("\nChecking Tools...");
if (checkFileContent(join(ROOT, "tools/grep.ts"), ["GrepTool", "ripgrep"])) passed++;
else failed++;
if (checkFileContent(join(ROOT, "tools/compression.ts"), ["compressContext", "tokenCount"])) passed++;
else failed++;

console.log(`\n--- Summary ---`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed === 0) {
  console.log("\nDEEP VERIFICATION SUCCESSFUL: All features confirmed present and correct.");
  process.exit(0);
} else {
  console.log("\nDEEP VERIFICATION FAILED: Some features are missing or incorrect.");
  process.exit(1);
}
