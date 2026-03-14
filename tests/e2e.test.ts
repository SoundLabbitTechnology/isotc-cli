import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

const CLI = path.join(__dirname, "../bin/isotc.js");
const ROOT = path.join(__dirname, "..");

function runCli(args: string, cwd = ROOT): string {
  return execSync(`node ${CLI} ${args}`, {
    encoding: "utf-8",
    cwd,
  });
}

describe("E2E: init → verify の一周", () => {
  it("init --force 後に verify --format json が成功する", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "isotc-e2e-"));
    try {
      runCli("init --force --format json", tmpDir);
      expect(fs.existsSync(path.join(tmpDir, ".spec", "constitution.toml"))).toBe(true);

      const verifyOutput = runCli("verify --format json", tmpDir);
      const parsed = JSON.parse(verifyOutput);
      expect(parsed.status).toBe("passed");
      expect(Array.isArray(parsed.violations)).toBe(true);
      expect(parsed.violations).toHaveLength(0);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("doctor --format json が constitution ありで ok を返す", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "isotc-e2e-doctor-"));
    try {
      runCli("init --force", tmpDir);
      const doctorOutput = runCli("doctor --format json", tmpDir);
      const parsed = JSON.parse(doctorOutput);
      expect(parsed.status).toBe("ok");
      expect(parsed.checks.constitution).toBe(true);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("emit copilot --force が .github/copilot-instructions.md を生成する", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "isotc-e2e-emit-"));
    try {
      runCli("init --force", tmpDir);
      runCli("emit copilot --force", tmpDir);
      const outputPath = path.join(tmpDir, ".github", "copilot-instructions.md");
      expect(fs.existsSync(outputPath)).toBe(true);
      const content = fs.readFileSync(outputPath, "utf-8");
      expect(content).toContain("アーキテクチャ規約");
      expect(content).toContain("verify");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
