import { ModeActivation, ModeConfig, getModeConfig } from './modes'
import { SHOULD_LOG } from '../../utils/logger'

export interface DetectedMode {
  mode: string
  keywords: string[]
  confidence: number
}

export interface KeywordDefinition {
  keyword: string
  mode: string
  language: string
  aliases?: string[]
}

const KEYWORD_DATABASE: KeywordDefinition[] = [
  // Ultrawork Keywords (English)
  {
    keyword: 'blitzkrieg',
    mode: 'blitzkrieg',
    language: 'English',
    aliases: ['ulw', 'max', 'full'],
  },
  { keyword: 'ultra work', mode: 'blitzkrieg', language: 'English' },
  { keyword: 'max performance', mode: 'blitzkrieg', language: 'English' },
  { keyword: 'go all out', mode: 'blitzkrieg', language: 'English' },
  { keyword: 'full power', mode: 'blitzkrieg', language: 'English' },

  // Search Keywords (English)
  {
    keyword: 'search',
    mode: 'search',
    language: 'English',
    aliases: ['find', 'locate', 'look for'],
  },
  { keyword: 'find', mode: 'search', language: 'English' },
  { keyword: 'locate', mode: 'search', language: 'English' },
  { keyword: 'look for', mode: 'search', language: 'English' },
  { keyword: 'explore', mode: 'search', language: 'English' },

  // Analyze Keywords (English)
  { keyword: 'analyze', mode: 'analyze', language: 'English', aliases: ['investigate', 'examine'] },
  { keyword: 'investigate', mode: 'analyze', language: 'English' },
  { keyword: 'examine', mode: 'analyze', language: 'English' },
  { keyword: 'deep analysis', mode: 'analyze', language: 'English' },
  { keyword: 'detailed analysis', mode: 'analyze', language: 'English' },

  // Ultrathink Keywords (English)
  {
    keyword: 'ultrathink',
    mode: 'ultrathink',
    language: 'English',
    aliases: ['think deeply', 'deep think'],
  },
  { keyword: 'think deeply', mode: 'ultrathink', language: 'English' },
  { keyword: 'deep think', mode: 'ultrathink', language: 'English' },
  { keyword: 'extended thinking', mode: 'ultrathink', language: 'English' },
  { keyword: 'careful reasoning', mode: 'ultrathink', language: 'English' },

  // Ultrawork Keywords (Spanish)
  {
    keyword: 'blitzkrieg',
    mode: 'blitzkrieg',
    language: 'Spanish',
    aliases: ['ulw', 'trabajo ultra'],
  },
  { keyword: 'trabajo ultra', mode: 'blitzkrieg', language: 'Spanish' },
  { keyword: 'máximo rendimiento', mode: 'blitzkrieg', language: 'Spanish' },

  // Search Keywords (Spanish)
  { keyword: 'buscar', mode: 'search', language: 'Spanish', aliases: ['encontrar', 'localizar'] },
  { keyword: 'encontrar', mode: 'search', language: 'Spanish' },
  { keyword: 'localizar', mode: 'search', language: 'Spanish' },

  // Analyze Keywords (Spanish)
  {
    keyword: 'analizar',
    mode: 'analyze',
    language: 'Spanish',
    aliases: ['investigar', 'examinar'],
  },
  { keyword: 'investigar', mode: 'analyze', language: 'Spanish' },
  { keyword: 'examinar', mode: 'analyze', language: 'Spanish' },

  // Ultrathink Keywords (Spanish)
  {
    keyword: 'pensar profundamente',
    mode: 'ultrathink',
    language: 'Spanish',
    aliases: ['piensa', 'razonamiento profundo'],
  },
  { keyword: 'piensa', mode: 'ultrathink', language: 'Spanish' },
  { keyword: 'razonamiento profundo', mode: 'ultrathink', language: 'Spanish' },

  // Ultrawork Keywords (French)
  {
    keyword: 'blitzkrieg',
    mode: 'blitzkrieg',
    language: 'French',
    aliases: ['ulw', 'travail ultra'],
  },
  { keyword: 'travail ultra', mode: 'blitzkrieg', language: 'French' },

  // Search Keywords (French)
  { keyword: 'chercher', mode: 'search', language: 'French', aliases: ['rechercher', 'trouver'] },
  { keyword: 'rechercher', mode: 'search', language: 'French' },
  { keyword: 'trouver', mode: 'search', language: 'French' },

  // Analyze Keywords (French)
  {
    keyword: 'analyser',
    mode: 'analyze',
    language: 'French',
    aliases: ['investiguer', 'examiner'],
  },
  { keyword: 'investiguer', mode: 'analyze', language: 'French' },
  { keyword: 'examiner', mode: 'analyze', language: 'French' },

  // Ultrathink Keywords (French)
  {
    keyword: 'réfléchir profondément',
    mode: 'ultrathink',
    language: 'French',
    aliases: ['réfléchis', 'pensée profonde'],
  },
  { keyword: 'réfléchis', mode: 'ultrathink', language: 'French' },

  // Ultrawork Keywords (German)
  { keyword: 'blitzkrieg', mode: 'blitzkrieg', language: 'German', aliases: ['ulw', 'maximal'] },
  { keyword: 'maximale leistung', mode: 'blitzkrieg', language: 'German' },

  // Search Keywords (German)
  { keyword: 'suchen', mode: 'search', language: 'German', aliases: ['finden', 'lokalisieren'] },
  { keyword: 'finden', mode: 'search', language: 'German' },

  // Analyze Keywords (German)
  {
    keyword: 'analysieren',
    mode: 'analyze',
    language: 'German',
    aliases: ['untersuchen', 'prüfen'],
  },
  { keyword: 'untersuchen', mode: 'analyze', language: 'German' },

  // Ultrathink Keywords (German)
  {
    keyword: 'nachdenken',
    mode: 'ultrathink',
    language: 'German',
    aliases: ['denk nach', 'sorgfältig denken'],
  },
  { keyword: 'denk nach', mode: 'ultrathink', language: 'German' },
  { keyword: 'sorgfältig denken', mode: 'ultrathink', language: 'German' },

  // Ultrawork Keywords (Korean)
  { keyword: '강력한', mode: 'blitzkrieg', language: 'Korean', aliases: ['울트라워크', '최대'] },
  { keyword: '울트라워크', mode: 'blitzkrieg', language: 'Korean' },
  { keyword: '최대', mode: 'blitzkrieg', language: 'Korean' },
  { keyword: '최고 성능', mode: 'blitzkrieg', language: 'Korean' },

  // Search Keywords (Korean)
  { keyword: '검색', mode: 'search', language: 'Korean', aliases: ['찾아', '찾기'] },
  { keyword: '찾아', mode: 'search', language: 'Korean' },
  { keyword: '찾기', mode: 'search', language: 'Korean' },

  // Analyze Keywords (Korean)
  { keyword: '분석', mode: 'analyze', language: 'Korean', aliases: ['조사', '검토'] },
  { keyword: '조사', mode: 'analyze', language: 'Korean' },
  { keyword: '검토', mode: 'analyze', language: 'Korean' },

  // Ultrathink Keywords (Korean)
  {
    keyword: '생각해',
    mode: 'ultrathink',
    language: 'Korean',
    aliases: ['깊게 생각', '신중한 사고'],
  },
  { keyword: '깊게 생각', mode: 'ultrathink', language: 'Korean' },
  { keyword: '신중한 사고', mode: 'ultrathink', language: 'Korean' },

  // Ultrawork Keywords (Chinese - Simplified)
  {
    keyword: '强力',
    mode: 'blitzkrieg',
    language: 'Chinese (Simplified)',
    aliases: ['超神', '最大'],
  },
  { keyword: '超神', mode: 'blitzkrieg', language: 'Chinese (Simplified)' },
  { keyword: '最大', mode: 'blitzkrieg', language: 'Chinese (Simplified)' },

  // Search Keywords (Chinese - Simplified)
  { keyword: '搜索', mode: 'search', language: 'Chinese (Simplified)', aliases: ['查找', '定位'] },
  { keyword: '查找', mode: 'search', language: 'Chinese (Simplified)' },
  { keyword: '定位', mode: 'search', language: 'Chinese (Simplified)' },

  // Analyze Keywords (Chinese - Simplified)
  { keyword: '分析', mode: 'analyze', language: 'Chinese (Simplified)', aliases: ['调查', '检查'] },
  { keyword: '调查', mode: 'analyze', language: 'Chinese (Simplified)' },
  { keyword: '检查', mode: 'analyze', language: 'Chinese (Simplified)' },

  // Ultrathink Keywords (Chinese - Simplified)
  {
    keyword: '深度思考',
    mode: 'ultrathink',
    language: 'Chinese (Simplified)',
    aliases: ['仔细思考', '让我想想'],
  },
  { keyword: '仔细思考', mode: 'ultrathink', language: 'Chinese (Simplified)' },
  { keyword: '让我想想', mode: 'ultrathink', language: 'Chinese (Simplified)' },

  // Ultrawork Keywords (Chinese - Traditional)
  {
    keyword: '强力',
    mode: 'blitzkrieg',
    language: 'Chinese (Traditional)',
    aliases: ['超神', '最大'],
  },
  { keyword: '超神', mode: 'blitzkrieg', language: 'Chinese (Traditional)' },
  { keyword: '最大', mode: 'blitzkrieg', language: 'Chinese (Traditional)' },

  // Search Keywords (Chinese - Traditional)
  { keyword: '搜索', mode: 'search', language: 'Chinese (Traditional)', aliases: ['查找', '定位'] },
  { keyword: '查找', mode: 'search', language: 'Chinese (Traditional)' },
  { keyword: '定位', mode: 'search', language: 'Chinese (Traditional)' },

  // Analyze Keywords (Chinese - Traditional)
  {
    keyword: '分析',
    mode: 'analyze',
    language: 'Chinese (Traditional)',
    aliases: ['調查', '檢查'],
  },
  { keyword: '調查', mode: 'analyze', language: 'Chinese (Traditional)' },
  { keyword: '檢查', mode: 'analyze', language: 'Chinese (Traditional)' },

  // Ultrathink Keywords (Chinese - Traditional)
  {
    keyword: '深度思考',
    mode: 'ultrathink',
    language: 'Chinese (Traditional)',
    aliases: ['仔細思考', '讓我思考'],
  },
  { keyword: '仔細思考', mode: 'ultrathink', language: 'Chinese (Traditional)' },
  { keyword: '讓我思考', mode: 'ultrathink', language: 'Chinese (Traditional)' },

  // Ultrawork Keywords (Japanese)
  { keyword: '強力', mode: 'blitzkrieg', language: 'Japanese', aliases: ['最大', 'フルパワー'] },
  { keyword: '最大', mode: 'blitzkrieg', language: 'Japanese' },
  { keyword: 'フルパワー', mode: 'blitzkrieg', language: 'Japanese' },

  // Search Keywords (Japanese)
  { keyword: '検索', mode: 'search', language: 'Japanese', aliases: ['探す', '見つける'] },
  { keyword: '探す', mode: 'search', language: 'Japanese' },
  { keyword: '見つける', mode: 'search', language: 'Japanese' },

  // Analyze Keywords (Japanese)
  { keyword: '分析', mode: 'analyze', language: 'Japanese', aliases: ['調査', '検討'] },
  { keyword: '調査', mode: 'analyze', language: 'Japanese' },
  { keyword: '検討', mode: 'analyze', language: 'Japanese' },

  // Ultrathink Keywords (Japanese)
  {
    keyword: '深く考える',
    mode: 'ultrathink',
    language: 'Japanese',
    aliases: ['思考', '注意深く考える'],
  },
  { keyword: '思考', mode: 'ultrathink', language: 'Japanese' },
  { keyword: '注意深く考える', mode: 'ultrathink', language: 'Japanese' },

  // Ultrawork Keywords (Portuguese)
  {
    keyword: 'blitzkrieg',
    mode: 'blitzkrieg',
    language: 'Portuguese',
    aliases: ['ulw', 'trabalho ultra'],
  },
  { keyword: 'trabalho ultra', mode: 'blitzkrieg', language: 'Portuguese' },

  // Search Keywords (Portuguese)
  {
    keyword: 'pesquisar',
    mode: 'search',
    language: 'Portuguese',
    aliases: ['procurar', 'encontrar'],
  },
  { keyword: 'procurar', mode: 'search', language: 'Portuguese' },
  { keyword: 'encontrar', mode: 'search', language: 'Portuguese' },

  // Analyze Keywords (Portuguese)
  {
    keyword: 'analisar',
    mode: 'analyze',
    language: 'Portuguese',
    aliases: ['investigar', 'examinar'],
  },
  { keyword: 'investigar', mode: 'analyze', language: 'Portuguese' },
  { keyword: 'examinar', mode: 'analyze', language: 'Portuguese' },

  // Ultrathink Keywords (Portuguese)
  {
    keyword: 'pensar profundamente',
    mode: 'ultrathink',
    language: 'Portuguese',
    aliases: ['pense', 'raciocínio profundo'],
  },
  { keyword: 'pense', mode: 'ultrathink', language: 'Portuguese' },
  { keyword: 'raciocínio profundo', mode: 'ultrathink', language: 'Portuguese' },

  // Ultrawork Keywords (Italian)
  {
    keyword: 'blitzkrieg',
    mode: 'blitzkrieg',
    language: 'Italian',
    aliases: ['ulw', 'lavoro ultra'],
  },
  { keyword: 'lavoro ultra', mode: 'blitzkrieg', language: 'Italian' },

  // Search Keywords (Italian)
  { keyword: 'cercare', mode: 'search', language: 'Italian', aliases: ['trovare', 'ricercare'] },
  { keyword: 'trovare', mode: 'search', language: 'Italian' },
  { keyword: 'ricercare', mode: 'search', language: 'Italian' },

  // Analyze Keywords (Italian)
  {
    keyword: 'analizzare',
    mode: 'analyze',
    language: 'Italian',
    aliases: ['indagare', 'esaminare'],
  },
  { keyword: 'indagare', mode: 'analyze', language: 'Italian' },
  { keyword: 'esaminare', mode: 'analyze', language: 'Italian' },

  // Ultrathink Keywords (Italian)
  {
    keyword: 'pensare attentamente',
    mode: 'ultrathink',
    language: 'Italian',
    aliases: ['pensa', 'pensiero profondo'],
  },
  { keyword: 'pensa', mode: 'ultrathink', language: 'Italian' },
  { keyword: 'pensiero profondo', mode: 'ultrathink', language: 'Italian' },

  // Ultrawork Keywords (Russian)
  {
    keyword: 'ультраворк',
    mode: 'blitzkrieg',
    language: 'Russian',
    aliases: ['ulw', 'максимально'],
  },
  { keyword: 'максимально', mode: 'blitzkrieg', language: 'Russian' },

  // Search Keywords (Russian)
  { keyword: 'поиск', mode: 'search', language: 'Russian', aliases: ['найти', 'искать'] },
  { keyword: 'найти', mode: 'search', language: 'Russian' },
  { keyword: 'искать', mode: 'search', language: 'Russian' },

  // Analyze Keywords (Russian)
  {
    keyword: 'анализировать',
    mode: 'analyze',
    language: 'Russian',
    aliases: ['исследовать', 'изучить'],
  },
  { keyword: 'исследовать', mode: 'analyze', language: 'Russian' },
  { keyword: 'изучить', mode: 'analyze', language: 'Russian' },

  // Ultrathink Keywords (Russian)
  {
    keyword: 'подумать',
    mode: 'ultrathink',
    language: 'Russian',
    aliases: ['подумай', 'тщательно подумать'],
  },
  { keyword: 'подумай', mode: 'ultrathink', language: 'Russian' },
  { keyword: 'тщательно подумать', mode: 'ultrathink', language: 'Russian' },

  // Ultrawork Keywords (Arabic)
  {
    keyword: 'ألترا وورك',
    mode: 'blitzkrieg',
    language: 'Arabic',
    aliases: ['العمل القوي', 'الأقصى'],
  },

  // Search Keywords (Arabic)
  { keyword: 'بحث', mode: 'search', language: 'Arabic', aliases: ['إيجاد', 'تحديد موقع'] },

  // Analyze Keywords (Arabic)
  { keyword: 'تحليل', mode: 'analyze', language: 'Arabic', aliases: ['تحقيق', 'فحص'] },

  // Ultrathink Keywords (Arabic)
  {
    keyword: 'تفكير عميق',
    mode: 'ultrathink',
    language: 'Arabic',
    aliases: ['فكر', 'تفكر بعناية'],
  },
  { keyword: 'فكر', mode: 'ultrathink', language: 'Arabic' },

  // Ultrawork Keywords (Hindi)
  {
    keyword: 'अल्ट्रावर्क',
    mode: 'blitzkrieg',
    language: 'Hindi',
    aliases: ['अधिकतम', 'अधिक कार्य'],
  },
  { keyword: 'अधिकतम', mode: 'blitzkrieg', language: 'Hindi' },
  { keyword: 'अधिक कार्य', mode: 'blitzkrieg', language: 'Hindi' },

  // Search Keywords (Hindi)
  { keyword: 'खोज', mode: 'search', language: 'Hindi', aliases: ['ढूंढना', 'ढूंढो'] },

  // Analyze Keywords (Hindi)
  { keyword: 'विश्लेषण', mode: 'analyze', language: 'Hindi', aliases: ['जांच', 'जांचना'] },
  { keyword: 'जांच', mode: 'analyze', language: 'Hindi' },
  { keyword: 'जांचना', mode: 'analyze', language: 'Hindi' },

  // Ultrathink Keywords (Hindi)
  {
    keyword: 'गहरी सोच',
    mode: 'ultrathink',
    language: 'Hindi',
    aliases: ['सोचो', 'ध्यानपूर्वक सोच'],
  },
  { keyword: 'सोचो', mode: 'ultrathink', language: 'Hindi' },
  { keyword: 'ध्यानपूर्वक सोच', mode: 'ultrathink', language: 'Hindi' },
]

export function detectMode(text: string): DetectedMode | null {
  const lowercaseText = text.toLowerCase()
  const modeMatches: Map<string, Set<string>> = new Map()

  for (const keywordDef of KEYWORD_DATABASE) {
    const keywordLower = keywordDef.keyword.toLowerCase()

    if (lowercaseText.includes(keywordLower)) {
      if (!modeMatches.has(keywordDef.mode)) {
        modeMatches.set(keywordDef.mode, new Set())
      }

      modeMatches.get(keywordDef.mode)!.add(keywordDef.keyword)
    }

    if (keywordDef.aliases) {
      for (const alias of keywordDef.aliases) {
        const aliasLower = alias.toLowerCase()
        if (lowercaseText.includes(aliasLower)) {
          if (!modeMatches.has(keywordDef.mode)) {
            modeMatches.set(keywordDef.mode, new Set())
          }

          modeMatches.get(keywordDef.mode)!.add(keywordDef.keyword)
        }
      }
    }
  }

  if (modeMatches.size === 0) {
    return null
  }

  let bestMode: string = ''
  let bestKeywordCount = 0

  for (const [mode, keywords] of modeMatches.entries()) {
    if (keywords.size > bestKeywordCount) {
      bestMode = mode
      bestKeywordCount = keywords.size
    }
  }

  const keywords = Array.from(modeMatches.get(bestMode)!)
  const confidence = bestKeywordCount > 2 ? 0.9 : bestKeywordCount > 1 ? 0.7 : 0.5

  if (SHOULD_LOG) console.log(
    `[mode-detector] Detected mode "${bestMode}" with ${bestKeywordCount} keyword matches (confidence: ${confidence})`,
  )

  return {
    mode: bestMode,
    keywords,
    confidence,
  }
}

export function getAllKeywords(): KeywordDefinition[] {
  return [...KEYWORD_DATABASE]
}

export function getKeywordsByMode(mode: string): KeywordDefinition[] {
  return KEYWORD_DATABASE.filter((k) => k.mode === mode)
}

export function getKeywordsByLanguage(language: string): KeywordDefinition[] {
  return KEYWORD_DATABASE.filter((k) => k.language === language)
}
