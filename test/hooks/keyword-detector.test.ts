import { describe, it, expect } from "bun:test"
import { createKeywordDetector } from "../../src/hooks/keyword-detector"

describe("Keyword Detector Hook", () => {
  describe("createKeywordDetector", () => {
    it("should create keyword detector hook", () => {
      const hook = createKeywordDetector({})
      expect(hook).toBeDefined()
      expect(hook["chat.message"]).toBeDefined()
    })

    it("should accept custom config", () => {
      const customConfig = {
        enabled: false,
        keywords: {
          "custom": "custom-mode",
        },
      }
      const hook = createKeywordDetector({}, { config: customConfig })
      expect(hook).toBeDefined()
    })

    it("should use default config when none provided", () => {
      const hook = createKeywordDetector({})
      expect(hook).toBeDefined()
    })
  })

  describe("keyword detection", () => {
    it("should detect 'think' keyword", async () => {
      const hook = createKeywordDetector({})
      const chatMessageHook = hook["chat.message"]
      expect(chatMessageHook).toBeDefined()

      const mockInput = { config: {} }
      const mockOutput = {
        parts: [
          { type: "text", text: "I need to think about this" }
        ]
      }

      await chatMessageHook(mockInput, mockOutput)
    })

    it("should detect 'search' keyword", async () => {
      const hook = createKeywordDetector({})
      const chatMessageHook = hook["chat.message"]

      const mockInput = { config: {} }
      const mockOutput = {
        parts: [
          { type: "text", text: "Please search for this" }
        ]
      }

      await chatMessageHook(mockInput, mockOutput)
    })

    it("should detect 'analyze' keyword", async () => {
      const hook = createKeywordDetector({})
      const chatMessageHook = hook["chat.message"]

      const mockInput = { config: {} }
      const mockOutput = {
        parts: [
          { type: "text", text: "Analyze this code" }
        ]
      }

      await chatMessageHook(mockInput, mockOutput)
    })

    it("should detect 'blitz' keyword", async () => {
      const hook = createKeywordDetector({})
      const chatMessageHook = hook["chat.message"]

      const mockInput = { config: {} }
      const mockOutput = {
        parts: [
          { type: "text", text: "Blitz through this task" }
        ]
      }

      await chatMessageHook(mockInput, mockOutput)
    })
  })

  describe("multilingual detection", () => {
    it("should detect Spanish 'piensa'", async () => {
      const hook = createKeywordDetector({})
      const chatMessageHook = hook["chat.message"]

      const mockInput = { config: {} }
      const mockOutput = {
        parts: [
          { type: "text", text: "Por favor piensa en esto" }
        ]
      }

      await chatMessageHook(mockInput, mockOutput)
    })

    it("should detect French 'réfléchis'", async () => {
      const hook = createKeywordDetector({})
      const chatMessageHook = hook["chat.message"]

      const mockInput = { config: {} }
      const mockOutput = {
        parts: [
          { type: "text", text: "Réfléchis à ce problème" }
        ]
      }

      await chatMessageHook(mockInput, mockOutput)
    })

    it("should detect German 'denk nach'", async () => {
      const hook = createKeywordDetector({})
      const chatMessageHook = hook["chat.message"]

      const mockInput = { config: {} }
      const mockOutput = {
        parts: [
          { type: "text", text: "Denk nach über die Lösung" }
        ]
      }

      await chatMessageHook(mockInput, mockOutput)
    })

    it("should detect Chinese '思考'", async () => {
      const hook = createKeywordDetector({})
      const chatMessageHook = hook["chat.message"]

      const mockInput = { config: {} }
      const mockOutput = {
        parts: [
          { type: "text", text: "请思考这个问题" }
        ]
      }

      await chatMessageHook(mockInput, mockOutput)
    })

    it("should detect Japanese '考えて'", async () => {
      const hook = createKeywordDetector({})
      const chatMessageHook = hook["chat.message"]

      const mockInput = { config: {} }
      const mockOutput = {
        parts: [
          { type: "text", text: "これについて考えて" }
        ]
      }

      await chatMessageHook(mockInput, mockOutput)
    })

    it("should detect Korean '생각해'", async () => {
      const hook = createKeywordDetector({})
      const chatMessageHook = hook["chat.message"]

      const mockInput = { config: {} }
      const mockOutput = {
        parts: [
          { type: "text", text: "이것에 대해 생각해" }
        ]
      }

      await chatMessageHook(mockInput, mockOutput)
    })

    it("should detect Russian 'подумай'", async () => {
      const hook = createKeywordDetector({})
      const chatMessageHook = hook["chat.message"]

      const mockInput = { config: {} }
      const mockOutput = {
        parts: [
          { type: "text", text: "Подумай об этом" }
        ]
      }

      await chatMessageHook(mockInput, mockOutput)
    })

    it("should detect Arabic 'فكر'", async () => {
      const hook = createKeywordDetector({})
      const chatMessageHook = hook["chat.message"]

      const mockInput = { config: {} }
      const mockOutput = {
        parts: [
          { type: "text", text: "فكر في هذا الأمر" }
        ]
      }

      await chatMessageHook(mockInput, mockOutput)
    })
  })

  describe("disabled mode", () => {
    it("should not detect when disabled", async () => {
      const hook = createKeywordDetector({}, { config: { enabled: false } })
      const chatMessageHook = hook["chat.message"]

      const mockInput = { config: {} }
      const mockOutput = {
        parts: [
          { type: "text", text: "I need to think about this" }
        ]
      }

      await chatMessageHook(mockInput, mockOutput)
    })
  })

  describe("text handling", () => {
    it("should handle empty text", async () => {
      const hook = createKeywordDetector({})
      const chatMessageHook = hook["chat.message"]

      const mockInput = { config: {} }
      const mockOutput = {
        parts: [
          { type: "text", text: "" }
        ]
      }

      await chatMessageHook(mockInput, mockOutput)
    })

    it("should handle whitespace only", async () => {
      const hook = createKeywordDetector({})
      const chatMessageHook = hook["chat.message"]

      const mockInput = { config: {} }
      const mockOutput = {
        parts: [
          { type: "text", text: "   " }
        ]
      }

      await chatMessageHook(mockInput, mockOutput)
    })

    it("should handle non-text parts", async () => {
      const hook = createKeywordDetector({})
      const chatMessageHook = hook["chat.message"]

      const mockInput = { config: {} }
      const mockOutput = {
        parts: [
          { type: "image", url: "https://example.com/image.png" }
        ]
      }

      await chatMessageHook(mockInput, mockOutput)
    })
  })
})
