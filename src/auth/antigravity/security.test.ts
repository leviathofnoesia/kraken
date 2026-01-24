import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { promises as fs } from "node:fs"
import { isTokenExpired, parseStoredToken } from "./token"
import { ANTIGRAVITY_TOKEN_REFRESH_BUFFER_MS } from "./constants"
import type { AntigravityTokens, AccountStorage, AccountMetadata, AccountTier } from "./types"
import { AccountManager, type ManagedAccount } from "./accounts"

function createMockAuthDetails(refresh = "refresh-token|project-id"): { refresh: string; access: string; expires: number } {
  return {
    refresh,
    access: "access-token",
    expires: Date.now() + 3600000,
  }
}

function createMockAccountMetadata(overrides: Partial<AccountMetadata> = {}): AccountMetadata {
  return {
    email: "test@example.com",
    tier: "free" as AccountTier,
    refreshToken: "refresh-token",
    projectId: "project-id",
    managedProjectId: undefined,
    accessToken: "access-token",
    expiresAt: Date.now() + 3600000,
    rateLimits: {},
    ...overrides,
  }
}

function createMockAccountStorage(accounts: AccountMetadata[], activeIndex = 0): AccountStorage {
  return {
    version: 1,
    accounts,
    activeIndex,
  }
}

describe("Auth Security Tests", () => {
  describe("Token Expiry", () => {
    it("should NOT be expired with 2 minutes remaining", () => {
      const token: AntigravityTokens = {
        type: "antigravity",
        access_token: "test-access",
        refresh_token: "test-refresh",
        expires_in: 120,
        timestamp: Date.now(),
      }
      expect(isTokenExpired(token)).toBe(false)
    })

    it("should be expired when less than 60 seconds remaining", () => {
      const token: AntigravityTokens = {
        type: "antigravity",
        access_token: "test-access",
        refresh_token: "test-refresh",
        expires_in: 30,
        timestamp: Date.now(),
      }
      expect(isTokenExpired(token)).toBe(true)
    })

    it("should be expired at exactly 60 seconds (boundary)", () => {
      const token: AntigravityTokens = {
        type: "antigravity",
        access_token: "test-access",
        refresh_token: "test-refresh",
        expires_in: 60,
        timestamp: Date.now(),
      }
      expect(isTokenExpired(token)).toBe(true)
    })

    it("should be expired when token is already past expiry", () => {
      const token: AntigravityTokens = {
        type: "antigravity",
        access_token: "test-access",
        refresh_token: "test-refresh",
        expires_in: 3600,
        timestamp: Date.now() - 4000 * 1000,
      }
      expect(isTokenExpired(token)).toBe(true)
    })

    it("should have 60 second buffer", () => {
      expect(ANTIGRAVITY_TOKEN_REFRESH_BUFFER_MS).toBe(60000)
    })
  })

  describe("Account Isolation", () => {
    let testDir: string

    beforeEach(async () => {
      testDir = join(tmpdir(), `auth-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
      await fs.mkdir(testDir, { recursive: true })
    })

    afterEach(async () => {
      try {
        await fs.rm(testDir, { recursive: true, force: true })
      } catch {}
    })

    it("should isolate rate limits between accounts", () => {
      const storedAccounts = createMockAccountStorage(
        [
          createMockAccountMetadata({ email: "user1@example.com" }),
          createMockAccountMetadata({ email: "user2@example.com" }),
        ],
        0
      )
      const auth = createMockAuthDetails()
      const manager = new AccountManager(auth, storedAccounts)

      const accounts = manager.getAccounts()
      manager.markRateLimited(accounts[0]!, 60000, "claude")

      expect(accounts[0]?.rateLimits.claude).toBeDefined()
      expect(accounts[1]?.rateLimits.claude).toBeUndefined()
    })

    it("should isolate refresh tokens between accounts", () => {
      const storedAccounts = createMockAccountStorage(
        [
          createMockAccountMetadata({ email: "user1@example.com", refreshToken: "refresh-1" }),
          createMockAccountMetadata({ email: "user2@example.com", refreshToken: "refresh-2" }),
        ],
        0
      )
      const auth = createMockAuthDetails()
      const manager = new AccountManager(auth, storedAccounts)

      const accounts = manager.getAccounts()

      expect(accounts[0]?.parts.refreshToken).toBe("refresh-1")
      expect(accounts[1]?.parts.refreshToken).toBe("refresh-2")
    })
  })

  describe("Error Message Security (No Info Leak)", () => {
    it("should NOT expose email in error when no accounts", () => {
      const storedAccounts = createMockAccountStorage(
        [createMockAccountMetadata({ email: "secret-user@example.com" })],
        0
      )
      const auth = createMockAuthDetails()
      const manager = new AccountManager(auth, storedAccounts)

      while (manager.getAccountCount() > 0) {
        manager.removeAccount(0)
      }

      expect(() => manager.toAuthDetails()).toThrow("No accounts available")
    })

    it("should handle invalid remove index gracefully", () => {
      const storedAccounts = createMockAccountStorage(
        [createMockAccountMetadata({ email: "user@example.com" })],
        0
      )
      const auth = createMockAuthDetails()
      const manager = new AccountManager(auth, storedAccounts)

      const result = manager.removeAccount(999)
      expect(result).toBe(false)
    })
  })

  describe("Token Parsing", () => {
    it("should parse refresh token with project ID", () => {
      const result = parseStoredToken("refresh-token|my-project|managed-id")
      expect(result.refreshToken).toBe("refresh-token")
      expect(result.projectId).toBe("my-project")
      expect(result.managedProjectId).toBe("managed-id")
    })

    it("should handle refresh token without managed project", () => {
      const result = parseStoredToken("refresh-token|my-project")
      expect(result.refreshToken).toBe("refresh-token")
      expect(result.projectId).toBe("my-project")
      expect(result.managedProjectId).toBeUndefined()
    })

    it("should handle refresh token without project ID", () => {
      const result = parseStoredToken("refresh-token")
      expect(result.refreshToken).toBe("refresh-token")
      expect(result.projectId).toBeUndefined()
    })

    it("should handle empty string", () => {
      const result = parseStoredToken("")
      expect(result.refreshToken).toBe("")
      expect(result.projectId).toBeUndefined()
    })
  })

  describe("Session State Integrity", () => {
    let testDir: string

    beforeEach(async () => {
      testDir = join(tmpdir(), `session-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
      await fs.mkdir(testDir, { recursive: true })
    })

    afterEach(async () => {
      try {
        await fs.rm(testDir, { recursive: true, force: true })
      } catch {}
    })

    it("should maintain state after save/load", async () => {
      const storedAccounts = createMockAccountStorage(
        [
          createMockAccountMetadata({ email: "user1@example.com", tier: "paid" }),
          createMockAccountMetadata({ email: "user2@example.com", tier: "free" }),
        ],
        1
      )
      const auth = createMockAuthDetails()
      const manager = new AccountManager(auth, storedAccounts)

      const savePath = join(testDir, "accounts.json")
      await manager.save(savePath)

      const content = await fs.readFile(savePath, "utf-8")
      const loadedStorage = JSON.parse(content) as AccountStorage

      expect(loadedStorage.accounts[0].email).toBe("user1@example.com")
      expect(loadedStorage.accounts[1].email).toBe("user2@example.com")
      expect(loadedStorage.activeIndex).toBe(1)
    })

    it("should preserve rate limits through save/load", async () => {
      const storedAccounts = createMockAccountStorage(
        [createMockAccountMetadata({ email: "user@example.com" })],
        0
      )
      const auth = createMockAuthDetails()
      const manager = new AccountManager(auth, storedAccounts)

      const account = manager.getCurrentAccount()!
      const resetTime = Date.now() + 60000
      account.rateLimits.claude = resetTime

      const savePath = join(testDir, "accounts.json")
      await manager.save(savePath)

      const content = await fs.readFile(savePath, "utf-8")
      const loadedStorage = JSON.parse(content) as AccountStorage

      expect(loadedStorage.accounts[0].rateLimits.claude).toBe(resetTime)
    })

    it("getAccounts() should return copy (not mutate internal state)", () => {
      const storedAccounts = createMockAccountStorage(
        [createMockAccountMetadata({ email: "user@example.com" })],
        0
      )
      const auth = createMockAuthDetails()
      const manager = new AccountManager(auth, storedAccounts)

      const accounts1 = manager.getAccounts()
      accounts1[0]!.access = "mutated"

      const accounts2 = manager.getAccounts()

      expect(accounts2[0]?.access).toBe("access-token")
      expect(accounts1[0]).not.toBe(accounts2[0])
    })
  })

  describe("Rate Limit Rotation", () => {
    it("should return null when all accounts rate limited", () => {
      const storedAccounts = createMockAccountStorage(
        [
          createMockAccountMetadata({ email: "user1@example.com", tier: "free" }),
          createMockAccountMetadata({ email: "user2@example.com", tier: "free" }),
        ],
        0
      )
      const auth = createMockAuthDetails()
      const manager = new AccountManager(auth, storedAccounts)

      const accounts = manager.getAccounts()
      for (const acc of accounts) {
        manager.markRateLimited(acc, 60000, "claude")
      }

      const result = manager.getCurrentOrNextForFamily("claude")
      expect(result).toBeNull()
    })

    it("should rotate through accounts", () => {
      const storedAccounts = createMockAccountStorage(
        [
          createMockAccountMetadata({ email: "user1@example.com" }),
          createMockAccountMetadata({ email: "user2@example.com" }),
          createMockAccountMetadata({ email: "user3@example.com" }),
        ],
        0
      )
      const auth = createMockAuthDetails()
      const manager = new AccountManager(auth, storedAccounts)

      const selections: string[] = []
      for (let i = 0; i < 3; i++) {
        const account = manager.getCurrentAccount()!
        selections.push(account.email!)
        manager.markRateLimited(account, 60000, "claude")
        manager.getCurrentOrNextForFamily("claude")
      }

      expect(selections).toEqual(["user1@example.com", "user2@example.com", "user3@example.com"])
    })
  })
})
