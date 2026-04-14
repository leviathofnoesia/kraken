import { createHash } from "crypto"

const CONTENT_HASHES = new Map<string, string>()

export function hashContent(content: string): string {
  const normalizedContent = content
    .replace(/\s+/g, " ")
    .replace(/\n\s+/g, "\n")
    .trim()

  return createHash("sha256").update(normalizedContent).digest("hex")
}

export function getOrComputeHash(content: string): { hash: string; isNew: boolean } {
  const hash = hashContent(content)

  const existingHash = CONTENT_HASHES.get(hash)

  if (existingHash === content) {
    return {
      hash,
      isNew: false,
    }
  }

  CONTENT_HASHES.set(hash, content)

  return {
    hash,
    isNew: true,
  }
}

export function clearHashes(): void {
  CONTENT_HASHES.clear()
}

export function getHashSize(): number {
  return CONTENT_HASHES.size
}
