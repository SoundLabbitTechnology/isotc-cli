import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import * as path from "path";

const CLI = path.join(__dirname, "../bin/isotc.js");

function runCli(args: string): string {
  return execSync(`node ${CLI} ${args}`, {
    encoding: "utf-8",
    cwd: path.join(__dirname, ".."),
  });
}

describe("CLI スナップショット", () => {
  it("isotc --help の出力が期待通り", () => {
    const output = runCli("--help");
    expect(output).toContain("isotc");
    expect(output).toContain("init");
    expect(output).toContain("intent");
    expect(output).toContain("plan");
    expect(output).toContain("impl");
    expect(output).toContain("handoff");
    expect(output).toContain("verify");
    expect(output).toContain("trace");
    expect(output).toContain("emit");
    expect(output).toContain("doctor");
    expect(output).toContain("config");
  });

  it("isotc verify --help の出力が期待通り", () => {
    const output = runCli("verify --help");
    expect(output).toContain("verify");
    expect(output).toContain("--format");
    expect(output).toContain("--staged");
    expect(output).toContain("--changed-files");
    expect(output).toContain("--audience");
  });

  it("isotc emit --help の出力が期待通り", () => {
    const output = runCli("emit --help");
    expect(output).toContain("emit");
    expect(output).toContain("copilot");
    expect(output).toContain("claude");
    expect(output).toContain("agents");
  });

  it("isotc --version がバージョンを返す", () => {
    const output = runCli("--version");
    expect(output.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
