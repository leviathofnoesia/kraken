import type { Hooks } from "@opencode-ai/plugin"
import type { PluginInput } from "@opencode-ai/plugin"
import type { Part } from "@opencode-ai/sdk"
import { COMMENT_PATTERNS, EXCEPTION_PATTERNS, LANGUAGE_COMMENT_DELIMITERS, getLanguageFromFile } from "./patterns"

export interface CommentCheckerConfig {
  enabled?: boolean
  requireJustification?: boolean
  checkAfterToolUse?: boolean
  customPrompt?: string
}

function getTextFromParts(parts: Part[]): string {
  return parts
    .filter((p): p is Extract<Part, { type: "text" }> => p.type === "text")
    .map(p => p.text)
    .join("\n")
    .trim()
}

function isExceptionComment(line: string): boolean {
  const trimmedLine = line.trim()
  
  for (const [category, patterns] of Object.entries(EXCEPTION_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(trimmedLine)) {
        return true
      }
    }
  }
  
  return false
}

function extractCodeFromToolOutput(output: string): Array<{ filename: string; content: string }> {
  const codeBlocks: Array<{ filename: string; content: string }> = []
  
  const fileRegex = /(?:^|\n)Writing to (.+?)\n/g
  const matches = [...output.matchAll(fileRegex)]
  
  for (const match of matches) {
    const filename = match[1]
    const startPos = match.index! + match[0].length
    
    let endPos = output.length
    const nextFileMatch = output.substring(startPos).match(/\nWriting to .+?\n/)
    if (nextFileMatch) {
      endPos = startPos + nextFileMatch.index!
    }
    
    const content = output.substring(startPos, endPos).trim()
    codeBlocks.push({ filename, content })
  }
  
  return codeBlocks
}

function checkCommentsInCode(
  code: string,
  filename: string
): Array<{ type: string; line: number; text: string; isException: boolean }> {
  const comments: Array<{ type: string; line: number; text: string; isException: boolean }> = []
  const lines = code.split("\n")
  const language = getLanguageFromFile(filename)
  const delimiters = language ? LANGUAGE_COMMENT_DELIMITERS[language as keyof typeof LANGUAGE_COMMENT_DELIMITERS] : null
  
  let inMultiLine = false
  let multiLineStartLine = 0
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()
    
    if (delimiters && "multi" in delimiters && delimiters.multi.length > 0) {
      if (trimmedLine.startsWith(delimiters.multi[0]) || inMultiLine) {
        if (!inMultiLine) {
          inMultiLine = true
          multiLineStartLine = i
        }
        
        if (trimmedLine.endsWith(delimiters.multi[1])) {
          inMultiLine = false
        }
        continue
      }
    }
    
    if (delimiters && "shebang" in delimiters && Array.isArray(delimiters.shebang) && delimiters.shebang.length > 0) {
      if (line.startsWith(delimiters.shebang[0])) {
        continue
      }
    }
    
    let isCommentLine = false
    if (delimiters && "single" in delimiters) {
      isCommentLine = delimiters.single.some(d => trimmedLine.startsWith(d))
    }
    
    if (!isCommentLine) {
      if (trimmedLine.startsWith("//") || trimmedLine.startsWith("#")) {
        isCommentLine = true
      }
    }
    
    if (isCommentLine) {
      for (const [type, patterns] of Object.entries(COMMENT_PATTERNS)) {
        for (const pattern of patterns) {
          if (pattern.test(trimmedLine)) {
            const isException = isExceptionComment(trimmedLine)
            comments.push({
              type,
              line: i + 1,
              text: trimmedLine,
              isException,
            })
          }
        }
      }
    }
  }
  
  return comments
}

export function createCommentChecker(
  _input: PluginInput,
  options?: { config?: CommentCheckerConfig }
): Hooks {
  const config = options?.config ?? { enabled: true, checkAfterToolUse: true, requireJustification: false }
  
  return {
    "chat.message": async (input, output) => {
      if (!config.enabled) { return }
      const text = getTextFromParts(output.parts)
      
      const comments: Array<{ type: string; line: number; text: string }> = []
      const lines = text.split("\n")
      
      for (const [type, patterns] of Object.entries(COMMENT_PATTERNS)) {
        lines.forEach((line, index) => {
          for (const pattern of patterns) {
            if (pattern.test(line)) {
              const isException = isExceptionComment(line)
              if (!isException) {
                comments.push({
                  type,
                  line: index + 1,
                  text: line.trim(),
                })
              }
            }
          }
        })
      }
      
      if (comments.length > 0) {
        console.log(`[comment-checker] Found ${comments.length} annotated comments that need justification`)
      }
    },
    
    "tool.execute.after": async (input, output) => {
      if (!config.enabled || !config.checkAfterToolUse) { return }
      if (!output.output) return
      
      const { tool } = input
      const relevantTools = ["write", "edit", "multiEdit"]
      
      if (!relevantTools.includes(tool)) return
      
      const toolOutput = typeof output.output === "string" ? output.output : JSON.stringify(output.output)
      const codeBlocks = extractCodeFromToolOutput(toolOutput)
      
      const allComments: Array<{
        filename: string
        comments: Array<{ type: string; line: number; text: string; isException: boolean }>
      }> = []
      
      for (const { filename, content } of codeBlocks) {
        const comments = checkCommentsInCode(content, filename)
        
        const nonExceptionComments = comments.filter(c => !c.isException)
        
        if (nonExceptionComments.length > 0) {
          allComments.push({
            filename,
            comments: nonExceptionComments,
          })
          
          console.log(`[comment-checker] File ${filename}:`)
          for (const comment of nonExceptionComments) {
            console.log(`  Line ${comment.line}: ${comment.type} - ${comment.text.substring(0, 50)}`)
          }
        }
      }
      
      if (config.requireJustification && allComments.length > 0) {
        let justificationPrompt = `\n\n${"=".repeat(60)}\nCOMMENT CHECKER: ${allComments.length} file(s) contain non-exception annotated comments (TODO, FIXME, etc.)\n${"=".repeat(60)}\n\nBefore proceeding, you must justify why these comments are necessary:\n\n`
        
        for (const { filename, comments } of allComments) {
          justificationPrompt += `\nFile: ${filename}\n`
          for (const comment of comments) {
            justificationPrompt += `  [${comment.type}] Line ${comment.line}: ${comment.text.substring(0, 60)}...\n`
          }
        }
        
        justificationPrompt += `\nPlease provide justification for each comment or remove them.\n${"=".repeat(60)}\n`
        
        console.log(justificationPrompt)
      }
    },
  }
}
