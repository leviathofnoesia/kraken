interface GitHubIssue {
  title: string
  body: string | null
  number: number
  html_url: string
  state: string
}

interface CreatePullRequestOptions {
  head: string
  base?: string
  draft?: boolean
}

interface GitHubPullRequest {
  html_url: string
  number: number
  state: string
}

export class GitHubSDK {
  constructor(private token?: string) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'kraken-code',
      ...(init?.headers as Record<string, string> | undefined),
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    const response = await fetch(`https://api.github.com${path}`, {
      ...init,
      headers,
    })

    const text = await response.text()
    if (!response.ok) {
      throw new Error(`GitHub API request failed (${response.status}): ${text || response.statusText}`)
    }

    if (!text) {
      return {} as T
    }

    return JSON.parse(text) as T
  }

  async getIssue(owner: string, repo: string, number: number) {
    return this.request<GitHubIssue>(`/repos/${owner}/${repo}/issues/${number}`)
  }

  async createPullRequest(
    owner: string,
    repo: string,
    title: string,
    body: string,
    options?: CreatePullRequestOptions,
  ) {
    if (!options?.head) {
      throw new Error('createPullRequest requires options.head (source branch)')
    }

    const result = await this.request<GitHubPullRequest>(`/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      body: JSON.stringify({
        title,
        body,
        head: options.head,
        base: options.base ?? 'main',
        draft: options.draft ?? false,
      }),
    })

    return {
      url: result.html_url,
      number: result.number,
      state: result.state,
    }
  }
}

export const Octokit = GitHubSDK
