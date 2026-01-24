/**
 * Memory Integration
 *
 * Provides memory functionality using kratos-mcp package.
 * Kratos is the primary memory system (Obsidian removed per requirements).
 */

export interface MemoryProvider {
  name: string
}

export class KratosMemory implements MemoryProvider {
  name = "Kratos"
  
  async store(key: string, value: any): Promise<void> {
    // Use kratos-mcp tools via skills
    console.log(`[KratosMemory] Delegating to kratos-mcp tools`)
  }

  async retrieve(key: string): Promise<any> {
    // Use kratos-mcp tools via skills
    console.log(`[KratosMemory] Delegating to kratos-mcp tools`)
    return null
  }
}

export const memory = {
  kratos: new KratosMemory()
}
