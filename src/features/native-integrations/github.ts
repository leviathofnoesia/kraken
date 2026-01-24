
export class GitHubSDK {
  constructor(private token?: string) {}

  async getIssue(owner: string, repo: string, number: number) {
    return { title: "Placeholder Issue", body: "This is a placeholder" }
  }

  async createPullRequest(owner: string, repo: string, title: string, body: string) {
    return { url: `https://github.com/${owner}/${repo}/pull/1` }
  }
}

export const Octokit = GitHubSDK
