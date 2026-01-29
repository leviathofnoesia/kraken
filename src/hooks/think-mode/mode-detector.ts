import { ModeActivation, ModeConfig, getModeConfig } from "./modes"

const KEYWORD_DATABASE: KeywordDefinition[] = [
  // Blitzkrieg Keywords
  { keyword: "blitz", mode: "blitzkrieg" },
  { keyword: "blz", mode: "blitzkrieg" },
  { keyword: "blitzkrieg", mode: "blitzkrieg" },
  { keyword: "blitz mode", mode: "blitzkrieg" },

  // Search Keywords (English)
  { keyword: "search", mode: "search", language: "English", aliases: ["find", "locate", "look for"] },
  { keyword: "find", mode: "search", language: "English" },
  { keyword: "locate", mode: "search", language: "English" },
  { keyword: "look for", mode: "search", language: "English" },
  { keyword: "explore", mode: "search", language: "English" },

  // Analyze Keywords (English)
  { keyword: "analyze", mode: "analyze", language: "English", aliases: ["investigate", "examine"] },
  { keyword: "investigate", mode: "analyze", language: "English" },
  { keyword: "examine", mode: "analyze", language: "English" },
  { keyword: "deep analysis", mode: "analyze", language: "English" },

  // UltraThink Keywords (English)
  { keyword: "ultrathink", mode: "ultrathink", language: "English", aliases: ["think deeply", "deep think"] },
  { keyword: "think deeply", mode: "ultrathink", language: "English" },
  { keyword: "deep think", mode: "ultrathink", language: "English" },

  // Spanish Keywords
  { keyword: "analizar", mode: "analyze", language: "Spanish" },
  { keyword: "examinar", mode: "analyze", language: "Spanish" },

  // French Keywords
  { keyword: "analyser", mode: "analyze", language: "French" },
  { keyword: "examiner", mode: "analyze", language: "French" },

  // German Keywords
  { keyword: "analysieren", mode: "analyze", language: "German" },
]

export interface DetectedMode {
  mode: string
  keyword: string
  language?: string
}

export interface KeywordDefinition {
  keyword: string
  mode: string
  language?: string
  aliases?: string[]
}

export function detectMode(keyword: string): DetectedMode | null {
  const keywordLower = keyword.toLowerCase()

  // First check for exact matches in database
  for (const entry of KEYWORD_DATABASE) {
    if (entry.keyword.toLowerCase() === keywordLower) {
      return {
        mode: entry.mode,
        keyword: entry.keyword,
        language: entry.language
      }
    }
  }

  // Check for aliases
  for (const entry of KEYWORD_DATABASE) {
    if (entry.aliases && entry.aliases.some(alias => alias.toLowerCase() === keywordLower)) {
      return {
        mode: entry.mode,
        keyword: entry.keyword,
        language: entry.language
      }
    }
  }

  return null
}

export function detectLanguage(keyword: string): string | undefined {
  const keywordLower = keyword.toLowerCase()
  const arabicMatch = /[\u0600-\u06FF]/
  const hebrewMatch = /[\u0590-\u05FF]/
  const cyrillicMatch = /[\u0400-\u04FF]/
  const chineseMatch = /[\u4E00-\u9FFF]/
  const japaneseMatch = /[\u3040-\u30FF]/
  const koreanMatch = /[\uAC00-\uD7AF]/
  const greekMatch = /[\u0370-\u03FF]/
  const thaiMatch = /[\u0E00-\u0E7F]/

  if (arabicMatch.test(keyword)) return "Arabic"
  if (hebrewMatch.test(keyword)) return "Hebrew"
  if (cyrillicMatch.test(keyword)) {
    if (keywordLower.includes("подум")) return "Ukrainian"
    if (keywordLower.includes("дум")) return "Russian"
  }
  if (chineseMatch.test(keyword)) return "Chinese"
  if (japaneseMatch.test(keyword)) return "Japanese"
  if (koreanMatch.test(keyword)) return "Korean"
  if (greekMatch.test(keyword)) return "Greek"
  if (thaiMatch.test(keyword)) return "Thai"

  // Latin-based languages (simple prefix checking)
  const frenchKeywords = ["réfléchir", "pensa", "déjame", "pensar"]
  if (frenchKeywords.some(k => keywordLower.includes(k.toLowerCase()))) return "French"

  const spanishKeywords = ["piensa", "déjame", "necesito", "pensar"]
  if (spanishKeywords.some(k => keywordLower.includes(k.toLowerCase()))) return "Spanish"

  const germanKeywords = ["denk", "nachdenken"]
  if (germanKeywords.some(k => keywordLower.includes(k.toLowerCase()))) return "German"

  const italianKeywords = ["pensa", "pensare"]
  if (italianKeywords.some(k => keywordLower.includes(k.toLowerCase()))) return "Italian"

  const englishKeywords = ["think", "reason", "analyze", "investigate", "search", "find"]
  if (englishKeywords.some(k => keywordLower.includes(k))) return "English"

  return undefined
}
