export interface CompressionResult {
  compressed: string
  originalSize: number
  compressedSize: number
  ratio: number
  dictionary: Record<string, string>
}

export class AAAKCompressor {
  private dictionary: Map<string, string> = new Map()
  private reverseDict: Map<string, string> = new Map()
  private nextId = 0

  private static SEPARATOR = '\x00'

  compress(text: string): CompressionResult {
    const tokens = this.tokenize(text)
    const compressedTokens: string[] = []
    const dict: Record<string, string> = {}

    for (const token of tokens) {
      if (token.length <= 2 && !this.isWhitespace(token)) {
        compressedTokens.push(token)
        continue
      }

      if (this.isWhitespace(token)) {
        compressedTokens.push(token)
        continue
      }

      const existing = this.dictionary.get(token)
      if (existing) {
        compressedTokens.push(existing)
        dict[existing] = token
      } else {
        const code = this.generateCode()
        this.dictionary.set(token, code)
        this.reverseDict.set(code, token)
        dict[code] = token
        compressedTokens.push(code)
      }
    }

    const compressed = compressedTokens.join(AAAKCompressor.SEPARATOR)
    return {
      compressed,
      originalSize: text.length,
      compressedSize: compressed.length,
      ratio: compressed.length / Math.max(text.length, 1),
      dictionary: dict,
    }
  }

  decompress(compressed: string, dictionary: Record<string, string>): string {
    const tokens = compressed.split(AAAKCompressor.SEPARATOR)
    return tokens.map((t) => dictionary[t] ?? t).join('')
  }

  private isWhitespace(token: string): boolean {
    return /^[\s\n\r\t]$/.test(token)
  }

  private tokenize(text: string): string[] {
    const tokens: string[] = []
    let current = ''

    for (const char of text) {
      if (/[\s\n\r\t]/.test(char)) {
        if (current) tokens.push(current)
        tokens.push(char)
        current = ''
      } else if (/[a-zA-Z0-9_]/.test(char)) {
        current += char
      } else {
        if (current) tokens.push(current)
        tokens.push(char)
        current = ''
      }
    }
    if (current) tokens.push(current)

    return tokens
  }

  private generateCode(): string {
    const id = this.nextId++
    return `§${id.toString(36)}`
  }
}
