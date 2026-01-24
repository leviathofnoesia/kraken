import { describe, it, expect, beforeEach, afterEach, vi } from "bun:test"
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs"
import path from "node:path"
import os from "node:os"
import { registerPluginInConfig } from "./install"

describe("install", () => {
	const testDir = path.join(os.tmpdir(), "kraken-code-test-" + Date.now())
	const testConfigPath = path.join(testDir, "opencode.json")

	beforeEach(() => {
		mkdirSync(testDir, { recursive: true })
	})

	afterEach(() => {
		if (existsSync(testDir)) {
			rmSync(testDir, { recursive: true })
		}
	})

	describe("registerPluginInConfig", () => {
		it("should add plugin to empty config", () => {
			const content = "{}"
			const result = registerPluginInConfig(content, "json")
			expect(result).toContain("kraken-code")
			expect(result).toContain("plugin")
		})

		it("should add plugin to config without plugin array", () => {
			const content = `{
  "setting": "value"
}`
			const result = registerPluginInConfig(content, "json")
			expect(result).toContain("kraken-code")
			expect(result).toContain("plugin")
		})

		it("should not duplicate plugin if already registered", () => {
			const content = `{
  "plugin": ["kraken-code"]
}`
			const result = registerPluginInConfig(content, "json")
			const matches = result.match(/"kraken-code"/g)
			expect(matches).toHaveLength(1)
		})

		it("should handle pinned version registration", () => {
			const content = `{
  "plugin": ["kraken-code@1.0.0"]
}`
			const result = registerPluginInConfig(content, "json")
			expect(result).toContain("kraken-code@1.0.0")
		})

		it("should add plugin to existing plugin array", () => {
			const content = `{
  "plugin": ["other-plugin"]
}`
			const result = registerPluginInConfig(content, "json")
			expect(result).toContain("kraken-code")
			expect(result).toContain("other-plugin")
		})

		it("should preserve JSONC comments", () => {
			const content = `{
  // This is a comment
  "setting": "value"
}`
			const result = registerPluginInConfig(content, "jsonc")
			expect(result).toContain("// This is a comment")
			expect(result).toContain("kraken-code")
		})

		it("should handle config with trailing commas", () => {
			const content = `{
  "setting": "value",
}`
			const result = registerPluginInConfig(content, "json")
			expect(result).toContain("kraken-code")
		})
	})
})
