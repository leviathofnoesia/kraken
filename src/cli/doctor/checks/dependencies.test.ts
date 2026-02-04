import { describe, it, expect, spyOn, afterEach } from "bun:test"
import * as deps from "./dependencies"

describe("dependencies check", () => {
  describe("checkAstGrepCli", () => {
    it("returns dependency info", async () => {
      // #given
      // #when checking ast-grep cli
      const info = await deps.checkAstGrepCli()

      // #then should return valid info
      expect(info.name).toBe("AST-Grep CLI")
      expect(info.required).toBe(false)
      expect(typeof info.installed).toBe("boolean")
    })
  })

  describe("checkAstGrepNapi", () => {
    it("returns dependency info", () => {
      // #given
      // #when checking ast-grep napi
      const info = deps.checkAstGrepNapi()

      // #then should return valid info
      expect(info.name).toBe("AST-Grep NAPI")
      expect(info.required).toBe(false)
      expect(typeof info.installed).toBe("boolean")
    })
  })

  // describe("checkCommentChecker", () => {
  //   it("returns dependency info", async () => {
  //     // #given
  //     // #when checking comment checker
  //     const info = await deps.checkCommentChecker()
  //
  //     // #then should return valid info
  //     expect(info.name).toBe("Comment Checker")
  //     expect(info.required).toBe(false)
  //     expect(typeof info.installed).toBe("boolean")
  //   })
  // })

  describe("checkDependencyAstGrepCli", () => {
    let checkSpy: ReturnType<typeof spyOn>

    afterEach(() => {
      checkSpy?.mockRestore()
    })

    it("returns pass when installed", async () => {
      // #given ast-grep installed
      checkSpy = spyOn(deps, "checkAstGrepCli").mockResolvedValue({
        name: "AST-Grep CLI",
        required: false,
        installed: true,
        version: "0.25.0",
        path: "/usr/local/bin/sg",
      })

      // #when checking
      const result = await deps.checkDependencyAstGrepCli()

      // #then should pass
      expect(result.status).toBe("pass")
      expect(result.message).toContain("0.25.0")
    })

    it("returns warn when not installed", async () => {
      // #given ast-grep not installed
      checkSpy = spyOn(deps, "checkAstGrepCli").mockResolvedValue({
        name: "AST-Grep CLI",
        required: false,
        installed: false,
        version: null,
        path: null,
        installHint: "Install: npm install -g @ast-grep/cli",
      })

      // #when checking
      const result = await deps.checkDependencyAstGrepCli()

      // #then should warn (optional)
      expect(result.status).toBe("warn")
      expect(result.message).toContain("optional")
    })
  })

  describe("checkDependencyAstGrepNapi", () => {
    let checkSpy: ReturnType<typeof spyOn>

    afterEach(() => {
      checkSpy?.mockRestore()
    })

    it("returns pass when installed", async () => {
      // #given napi installed
      checkSpy = spyOn(deps, "checkAstGrepNapi").mockReturnValue({
        name: "AST-Grep NAPI",
        required: false,
        installed: true,
        version: null,
        path: null,
      })

      // #when checking
      const result = await deps.checkDependencyAstGrepNapi()

      // #then should pass
      expect(result.status).toBe("pass")
    })
  })

  describe("checkDependencyCommentChecker", () => {
    it("returns pass since it's built-in", async () => {
      // #when checking comment checker
      const result = await deps.checkDependencyCommentChecker()

      // #then should pass since it's built-in
      expect(result.status).toBe("pass")
      expect(result.message).toContain("Built-in hook")
    })
  })

  describe("checkDependencyPython3", () => {
    let checkSpy: ReturnType<typeof spyOn>

    afterEach(() => {
      checkSpy?.mockRestore()
    })

    it("returns pass when installed", async () => {
      // #given python installed
      checkSpy = spyOn(deps, "checkPython3").mockResolvedValue({
        name: "Python 3",
        required: false,
        installed: true,
        version: "Python 3.12.0",
        path: "/usr/bin/python3",
      })

      // #when checking
      const result = await deps.checkDependencyPython3()

      // #then should pass
      expect(result.status).toBe("pass")
      expect(result.message).toContain("Python 3.12.0")
    })
  })

  describe("checkDependencyRipgrep", () => {
    let checkSpy: ReturnType<typeof spyOn>

    afterEach(() => {
      checkSpy?.mockRestore()
    })

    it("returns warn when not installed", async () => {
      // #given ripgrep not installed
      checkSpy = spyOn(deps, "checkRipgrep").mockResolvedValue({
        name: "ripgrep (rg)",
        required: false,
        installed: false,
        version: null,
        path: null,
        installHint: "Install: apt install ripgrep or brew install ripgrep",
      })

      // #when checking
      const result = await deps.checkDependencyRipgrep()

      // #then should warn (optional)
      expect(result.status).toBe("warn")
      expect(result.message).toContain("optional")
    })
  })

  describe("getDependencyCheckDefinitions", () => {
    it("returns definitions for all dependencies", () => {
      // #given
      // #when getting definitions
      const defs = deps.getDependencyCheckDefinitions()

      // #then should have 5 definitions
      expect(defs.length).toBe(5)
      expect(defs.every((d) => d.category === "dependencies")).toBe(true)
      expect(defs.every((d) => d.critical === false)).toBe(true)
    })
  })
})
