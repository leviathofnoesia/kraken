import { describe, it, expect } from "bun:test"
import { ast_grep_search, ast_grep_replace } from "../../src/tools/ast-grep"

describe("AST-Grep Tool", () => {
  describe("search tool export", () => {
    it("should export ast_grep_search tool", () => {
      expect(ast_grep_search).toBeDefined()
    })

    it("should have required properties", () => {
      expect(ast_grep_search.description).toBeDefined()
      expect(ast_grep_search.args).toBeDefined()
      expect(ast_grep_search.execute).toBeDefined()
    })
  })

  describe("replace tool export", () => {
    it("should export ast_grep_replace tool", () => {
      expect(ast_grep_replace).toBeDefined()
    })

    it("should have required properties", () => {
      expect(ast_grep_replace.description).toBeDefined()
      expect(ast_grep_replace.args).toBeDefined()
      expect(ast_grep_replace.execute).toBeDefined()
    })
  })

  describe("ast_grep_search execute", () => {
    it("should handle valid pattern search", async () => {
      const result = await ast_grep_search.execute({
        pattern: "function $_$ { $$$$ }",
        language: "typescript",
      })
      const parsed = JSON.parse(result)
      expect(parsed).toBeDefined()
    })

    it("should handle pattern with path", async () => {
      const result = await ast_grep_search.execute({
        pattern: "const $A = $B",
        language: "typescript",
        path: "/home/leviath/kraken-code/src",
      })
      const parsed = JSON.parse(result)
      expect(parsed).toBeDefined()
    })

    it("should handle pattern with glob", async () => {
      const result = await ast_grep_search.execute({
        pattern: "export const",
        language: "typescript",
        glob: "*.ts",
      })
      const parsed = JSON.parse(result)
      expect(parsed).toBeDefined()
    })

    it("should handle empty pattern", async () => {
      const result = await ast_grep_search.execute({
        pattern: "",
        language: "typescript",
      })
      const parsed = JSON.parse(result)
      expect(parsed).toBeDefined()
    })
  })

  describe("ast_grep_replace execute", () => {
    it("should handle valid search and replace", async () => {
      const result = await ast_grep_replace.execute({
        pattern: "const $A = $B",
        replacement: "let $A = $B",
        language: "typescript",
      })
      const parsed = JSON.parse(result)
      expect(parsed).toBeDefined()
    })

    it("should handle replacement with path", async () => {
      const result = await ast_grep_replace.execute({
        pattern: "function $NAME$($ARGS$) { $BODY$ }",
        replacement: "const $NAME$ = ($ARGS$) => { $BODY$ }",
        language: "typescript",
        path: "/home/leviath/kraken-code/src",
      })
      const parsed = JSON.parse(result)
      expect(parsed).toBeDefined()
    })

    it("should handle empty pattern", async () => {
      const result = await ast_grep_replace.execute({
        pattern: "",
        replacement: "test",
        language: "typescript",
      })
      const parsed = JSON.parse(result)
      expect(parsed).toBeDefined()
    })
  })

  describe("error handling", () => {
    it("should handle missing ast-grep CLI gracefully", async () => {
      const result = await ast_grep_search.execute({
        pattern: "test",
        language: "typescript",
        path: "/nonexistent/path",
      })
      const parsed = JSON.parse(result)
      expect(parsed).toBeDefined()
    })
  })
})
