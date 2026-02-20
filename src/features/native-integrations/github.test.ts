import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { GitHubSDK } from './github'

describe('GitHubSDK', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = originalFetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  test('getIssue uses GitHub REST API and returns parsed issue', async () => {
    let requestUrl = ''

    globalThis.fetch = (async (url: unknown) => {
      requestUrl = String(url)
      return new Response(
        JSON.stringify({
          title: 'Bug report',
          body: 'Details',
          number: 42,
          html_url: 'https://github.com/acme/repo/issues/42',
          state: 'open',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      )
    }) as unknown as typeof fetch

    const sdk = new GitHubSDK('token-123')
    const issue = await sdk.getIssue('acme', 'repo', 42)

    expect(requestUrl).toBe('https://api.github.com/repos/acme/repo/issues/42')
    expect(issue.title).toBe('Bug report')
    expect(issue.number).toBe(42)
  })

  test('createPullRequest requires source branch', async () => {
    const sdk = new GitHubSDK('token-123')
    await expect(sdk.createPullRequest('acme', 'repo', 't', 'b')).rejects.toThrow('options.head')
  })

  test('createPullRequest posts to GitHub API and returns URL', async () => {
    let requestUrl = ''
    let requestMethod = ''

    globalThis.fetch = (async (url: unknown, init?: RequestInit) => {
      requestUrl = String(url)
      requestMethod = String(init?.method || '')
      return new Response(
        JSON.stringify({
          html_url: 'https://github.com/acme/repo/pull/5',
          number: 5,
          state: 'open',
        }),
        { status: 201, headers: { 'content-type': 'application/json' } },
      )
    }) as unknown as typeof fetch

    const sdk = new GitHubSDK('token-123')
    const pr = await sdk.createPullRequest('acme', 'repo', 'feat: x', 'body', {
      head: 'feature/x',
      base: 'main',
    })

    expect(requestUrl).toBe('https://api.github.com/repos/acme/repo/pulls')
    expect(requestMethod).toBe('POST')
    expect(pr.url).toBe('https://github.com/acme/repo/pull/5')
    expect(pr.number).toBe(5)
  })
})
