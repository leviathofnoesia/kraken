import type { Hooks } from "@opencode-ai/plugin"
import type { PluginInput } from "@opencode-ai/plugin"
import type { Part } from "@opencode-ai/sdk"

export interface KeywordDetectorConfig {
  enabled?: boolean
  keywords?: Record<string, string>
}

export interface DetectedKeyword {
  keyword: string
  mode: string
  language?: string
}

export function createKeywordDetector(
  _input: PluginInput,
  options?: { config?: KeywordDetectorConfig }
): Hooks {
  const config = options?.config ?? {
    enabled: true,
    keywords: {
      "blitz": "blitzkrieg",
      "blz": "blitzkrieg",
      "[BUILD]": "build",
      "[PLAN]": "plan",
      "[RESEARCH]": "research",
      "[DOCS]": "docs",
      "[REVIEW]": "review",

      "think": "think",
      "think deeply": "think",
      "ultrathink": "think",

      "search": "search",
      "analyze": "analyze",
      "investigate": "analyze",
      "[INVESTIGATE]": "research",

      "piensa": "think",
      "déjame pensar": "think",
      "necesito pensar": "think",
      "piénsalo": "think",
      "piensa cuidadosamente": "think",

      "réfléchis": "think",
      "laissez-moi réfléchir": "think",
      "je dois réfléchir": "think",
      "réfléchissez-y": "think",
      "réfléchir attentivement": "think",

      "denk nach": "think",
      "lass mich nachdenken": "think",
      "denk darüber nach": "think",
      "denke sorgfältig": "think",

      "pense": "think",
      "fammi pensare": "think",
      "devo pensare": "think",
      "pensa a questo": "think",
      "pensa attentamente": "think",

      "подумай": "think",
      "дай мне подумать": "think",
      "мне нужно подумать": "think",
      "подумай об этом": "think",
      "подумай внимательно": "think",

      "考えて": "think",
      "考えさせて": "think",
      "考える必要がある": "think",
      "これについて考えて": "think",
      "注意深く考えて": "think",

      "思考": "think",
      "让我想想": "think",
      "我需要思考": "think",
      "思考这个": "think",
      "仔细思考": "think",
      "思考這個": "think",

      "생각해": "think",
      "생각하게 해줘": "think",
      "이것에 대해 생각해": "think",
      "신중하게 생각해": "think",

      "فكر": "think",
      "أريد أن أفكر": "think",
      "دعني أفكر": "think",
      "فكر بعناية": "think",
      "تفكر باهتمام": "think",

      "חשב": "think",
      "תן להרהר": "think",
      "אני צריך לחשוב": "think",
      "חשב בריצות": "think",

      "pikirkan": "think",
      "saya perlu berpikir": "think",
      "biarkan saya berpikir": "think",
      "pikirkan dengan baik": "think",

      "подумай про це": "think",
      "подумай уважно": "think",

      "σκεψου": "think",
      "ας σκεφτεί": "think",
      "χρειάζεται να σκεφτώ": "think",
      "σκεφτεί σοβαρά": "think",

      "myslet": "think",
      "musím myslet": "think",
      "nechte mě myslet": "think",
      "myslet pozorně": "think",

      "gândește": "think",
      "trebuie să gândesc": "think",
      "gândește-te": "think",
      "gândește cu atenție": "think",

      "tænk": "think",
      "jeg skal tænke": "think",
      "lad mig tænke": "think",
      "tænk nøje": "think",

      "tänk": "think",
      "jag behöver tänka": "think",
      "låt mig tänka": "think",
      "tänk noga": "think",

      "denk": "think",
      "ik moet denken": "think",
      "laat me denken": "think",
      "denk goed na": "think",

      "คิด": "think",
      "ฉันต้องคิด": "think",
      "ให้ฉันคิด": "think",
      "คิดให้ดี": "think",
    }
  }

  function getTextFromParts(parts: Part[]): string {
    return parts
      .filter((p): p is Extract<Part, { type: "text" }> => p.type === "text")
      .map(p => p.text)
      .join("\n")
      .trim()
  }

  function detectLanguageAndMode(keyword: string): { language?: string; mode: string } {
    const arabicKeywords = ["فكر", "أريد أن أفكر", "دعني أفكر", "فكر بعناية", "تفكر باهتمام"]
    const hebrewKeywords = ["חשב", "תן להרהר", "אני צריך לחשוב", "חשב בריצות"]
    const indonesianKeywords = ["pikirkan", "saya perlu berpikir", "biarkan saya berpikir", "pikirkan dengan baik"]
    const ukrainianKeywords = ["подумай", "дай мені подумати", "мені потрібно подумати", "подумай про це", "подумай уважно"]
    const greekKeywords = ["σκεψου", "ας σκεφτεί", "χρειάζεται να σκεφτώ", "σκεφτεί σοβαρά"]
    const czechKeywords = ["myslet", "musím myslet", "nechte mě myslet", "myslet pozorně"]
    const romanianKeywords = ["gândește", "trebuie să gândesc", "gândește-te", "gândește cu atenție"]
    const danishKeywords = ["tænk", "jeg skal tænke", "lad mig tænke", "tænk nøje"]
    const swedishKeywords = ["tänk", "jag behöver tänka", "låt mig tänka", "tänk noga"]
    const norwegianKeywords = ["tænk", "jeg skal tænke", "lad mig tænke", "tænk nøje"]
    const dutchKeywords = ["denk", "ik moet denken", "laat me denken", "denk goed na"]
    const thaiKeywords = ["คิด", "ฉันต้องคิด", "ให้ฉันคิด", "คิดให้ดี"]

    const frenchKeywords = ["réfléchis", "laissez-moi réfléchir", "je dois réfléchir", "réfléchissez-y", "réfléchir attentivement"]
    const spanishKeywords = ["piensa", "déjame pensar", "necesito pensar", "piénsalo", "piensa cuidadosamente"]
    const germanKeywords = ["denk nach", "lass mich nachdenken", "denk darüber nach", "denke sorgfältig"]
    const italianKeywords = ["pensa", "fammi pensare", "devo pensare", "pensa a questo", "pensa attentamente"]
    const russianKeywords = ["подумай", "дай мне подумать", "мне нужно подумать", "подумай об этом", "подумай внимательно"]
    const japaneseKeywords = ["考えて", "考えさせて", "考える必要がある", "これについて考えて", "注意深く考えて"]
    const chineseKeywords = ["思考", "让我想想", "我需要思考", "思考这个", "仔细思考", "思考這個"]
    const koreanKeywords = ["생각해", "생각하게 해줘", "이것에 대해 생각해", "신중하게 생각해"]

    const thinkModeKeywords = [
      "think", "reason", "think deeply", "ultrathink", "ultra think",
      ...frenchKeywords,
      ...spanishKeywords,
      ...germanKeywords,
      ...italianKeywords,
      ...russianKeywords,
      ...japaneseKeywords,
      ...chineseKeywords,
      ...koreanKeywords,
      ...arabicKeywords,
      ...hebrewKeywords,
      ...indonesianKeywords,
      ...ukrainianKeywords,
      ...greekKeywords,
      ...czechKeywords,
      ...romanianKeywords,
      ...danishKeywords,
      ...swedishKeywords,
      ...norwegianKeywords,
      ...dutchKeywords,
      ...thaiKeywords,
    ]

    const searchModeKeywords = [
      "search", "find", "locate", "search for", "find in", "locate in",
      "검색", "찾아", "查找", "検索", "rechercher", "buscar", "suchen", "cercare", "найти", "חפש", "بحث", "cari", "пошук", "αναζήτηση", "hledat", "căuta", "søg", "sök", "zoek", "ค้นหา",
    ]

    const analyzeModeKeywords = [
      "analyze", "investigate", "examine", "deep dive", "deep analysis",
      "분석", "조사", "分析", "分析", "analyser", "analizar", "analysieren", "analizzare", "анализировать", "נתח", "تحليل", "analisis", "analiza", "аналізувати", "ανάλυση", "analyzovat", "analiza", "analyseer", "onderzoek", "วิเคราะห์",
    ]

    if (searchModeKeywords.includes(keyword.toLowerCase())) {
      return { mode: "search", language: detectLanguage(keyword) }
    }

    if (analyzeModeKeywords.includes(keyword.toLowerCase())) {
      return { mode: "analyze", language: detectLanguage(keyword) }
    }

    if (thinkModeKeywords.includes(keyword.toLowerCase())) {
      return { mode: "think", language: detectLanguage(keyword) }
    }

    return { mode: "enhanced", language: detectLanguage(keyword) }
  }

  function detectLanguage(keyword: string): string | undefined {
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

    const frenchKeywords = ["réfléchis", "pensa", "déjame", "pensar"]
    if (frenchKeywords.some(k => keywordLower.includes(k.toLowerCase()))) return "French"

    const spanishKeywords = ["piensa", "necesito", "pensar"]
    if (spanishKeywords.some(k => keywordLower.includes(k.toLowerCase()))) return "Spanish"

    const germanKeywords = ["denk", "nachdenken"]
    if (germanKeywords.some(k => keywordLower.includes(k.toLowerCase()))) return "German"

    const italianKeywords = ["pensa", "pensare"]
    if (italianKeywords.some(k => keywordLower.includes(k.toLowerCase()))) return "Italian"

    const englishKeywords = ["think", "reason", "analyze", "investigate", "search", "find"]
    if (englishKeywords.some(k => keywordLower.includes(k))) return "English"

    const czechKeywords = ["myslet", "myslet"]
    if (czechKeywords.some(k => keywordLower.includes(k.toLowerCase()))) return "Czech"

    const romanianKeywords = ["gând", "gândește"]
    if (romanianKeywords.some(k => keywordLower.includes(k.toLowerCase()))) return "Romanian"

    const danishKeywords = ["tænk", "tænke"]
    if (danishKeywords.some(k => keywordLower.includes(k.toLowerCase()))) return "Danish"

    const swedishKeywords = ["tänk"]
    if (swedishKeywords.some(k => keywordLower.includes(k.toLowerCase()))) return "Swedish"

    const norwegianKeywords = ["tænk"]
    if (norwegianKeywords.some(k => keywordLower.includes(k.toLowerCase()))) return "Norwegian"

    const dutchKeywords = ["denk"]
    if (dutchKeywords.some(k => keywordLower.includes(k.toLowerCase()))) return "Dutch"

    const indonesianKeywords = ["pikir"]
    if (indonesianKeywords.some(k => keywordLower.includes(k.toLowerCase()))) return "Indonesian"

    return undefined
  }

  return {
    "chat.message": async (input, output) => {
      if (!config.enabled) return

      const text = getTextFromParts(output.parts)
      if (!text) return

      const words = text.split(/\s+/)

      for (const word of words) {
        const mode = config.keywords?.[word]
        if (mode) {
          const detected = detectLanguageAndMode(word)
          console.log(`[keyword-detector] Detected "${word}" (${detected.language}), activating: ${detected.mode} mode`)

          const pluginConfig = (input as any).config as any

          if (detected.mode === "search") {
            console.log(`[keyword-detector] Activating search mode for ${detected.language}`)
          } else if (detected.mode === "analyze") {
            console.log(`[keyword-detector] Activating analyze mode for ${detected.language}`)
          } else if (detected.mode === "think") {
            console.log(`[keyword-detector] Activating think mode for ${detected.language}`)
          } else if (detected.mode === "enhanced") {
            console.log(`[keyword-detector] Activating enhanced mode`)
          }
        }
      }
    },
  }
}
