/**
 * Git Operations Tool
 *
 * Provides native Git operations for Kraken Code agents.
 * Uses simple-git for Git operations with proper error handling.
 */

import { tool } from '@opencode-ai/plugin'
import { z } from 'zod'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

const GitOptionsSchema = z.object({
  cwd: z.string().optional().describe('Working directory for the git command'),
})

const GitStatusSchema = GitOptionsSchema.extend({
  short: z.boolean().optional().describe('Use short format for status'),
})

const GitCommitSchema = GitOptionsSchema.extend({
  message: z.string().min(1).describe('Commit message'),
  all: z.boolean().optional().describe('Stage all modified files'),
  amend: z.boolean().optional().describe('Amend the previous commit'),
})

const GitBranchSchema = GitOptionsSchema.extend({
  list: z.boolean().optional().describe('List branches'),
  create: z.string().optional().describe('Create a new branch'),
  delete: z.string().optional().describe('Delete a branch'),
  current: z.boolean().optional().describe('Show current branch name'),
})

const GitPushSchema = GitOptionsSchema.extend({
  remote: z.string().optional().describe('Remote name (default: origin)'),
  branch: z.string().optional().describe('Branch to push'),
  setUpstream: z.boolean().optional().describe('Set upstream branch'),
  force: z.boolean().optional().describe('Force push'),
})

const GitPullSchema = GitOptionsSchema.extend({
  remote: z.string().optional().describe('Remote name (default: origin)'),
  branch: z.string().optional().describe('Branch to pull'),
  rebase: z.boolean().optional().describe('Use rebase instead of merge'),
})

const GitDiffSchema = GitOptionsSchema.extend({
  staged: z.boolean().optional().describe('Show staged changes'),
  file: z.string().optional().describe('Show diff for specific file'),
 stat: z.boolean().optional().describe('Show diffstat'),
  nameOnly: z.boolean().optional().describe('Show only changed file names'),
})

const GitLogSchema = GitOptionsSchema.extend({
  maxCount: z.number().optional().describe('Number of commits to show'),
  oneline: z.boolean().optional().describe('One line per commit'),
  file: z.string().optional().describe('Show commits affecting specific file'),
  author: z.string().optional().describe('Filter by author'),
})

const GitAddSchema = GitOptionsSchema.extend({
  patterns: z.array(z.string()).min(1).describe('Files/patterns to stage'),
})

const GitRemoteSchema = GitOptionsSchema.extend({
  verbose: z.boolean().optional().describe('Show remote URLs'),
  add: z.string().optional().describe('Add a remote'),
  remove: z.string().optional().describe('Remove a remote'),
})

async function runGit(args: string[], cwd?: string): Promise<string> {
  const options: { cwd?: string } = {}
  if (cwd) {
    options.cwd = cwd
  }
  try {
    const { stdout, stderr } = await execAsync(['git', ...args].join(' '), options)
    return stdout || stderr
  } catch (error: any) {
    if (error.stdout) return error.stdout
    if (error.stderr) return error.stderr
    throw new Error(`Git command failed: ${error.message}`)
  }
}

export const git_status = tool({
  description: 'Show the working tree status. Displays paths that have differences between the index file and the current HEAD commit, paths in the working tree that are not tracked by Git, and paths that are not ignored by .gitignore.',
  args: {
    options: GitStatusSchema.optional(),
  },
  async execute({ options }) {
    const args = ['status']
    if (options?.short) {
      args.push('--short')
    }
    args.push('--porcelain=v1')
    const result = await runGit(args, options?.cwd)
    return JSON.stringify({ status: 'success', output: result || 'Working tree clean' })
  },
})

export const git_commit = tool({
  description: 'Record changes to the repository. Creates a new commit containing the current contents of the index and the given log message describing the changes.',
  args: {
    options: GitCommitSchema,
  },
  async execute({ options }) {
    const args = ['commit']
    
    if (options.all) {
      args.push('-a')
    }
    if (options.amend) {
      args.push('--amend')
    }
    args.push('-m', options.message)
    
    const result = await runGit(args, options.cwd)
    return JSON.stringify({ status: 'success', output: result })
  },
})

export const git_branch = tool({
  description: 'List, create, or delete branches. Without options, git branch lists all local branches and marks the current branch with an asterisk.',
  args: {
    options: GitBranchSchema.optional(),
  },
  async execute({ options = {} }) {
    const args: string[] = []
    
    if (options.list) {
      args.push('--list')
    } else if (options.create) {
      args.push('-b', options.create)
    } else if (options.delete) {
      args.push('-d', options.delete)
    } else if (options.current) {
      args.push('--show-current')
    } else {
      args.push('-a')
    }
    
    const result = await runGit(args, options.cwd)
    return JSON.stringify({ status: 'success', output: result })
  },
})

export const git_push = tool({
  description: 'Update remote refs along with associated objects. Pushes commits from the local branch to the corresponding remote branch.',
  args: {
    options: GitPushSchema.optional(),
  },
  async execute({ options = {} }) {
    const args = ['push']
    
    if (options.remote) {
      args.push(options.remote)
    }
    if (options.branch) {
      args.push(options.branch)
    }
    if (options.setUpstream) {
      args.push('-u')
    }
    if (options.force) {
      args.push('--force')
    }
    
    const result = await runGit(args, options.cwd)
    return JSON.stringify({ status: 'success', output: result })
  },
})

export const git_pull = tool({
  description: 'Fetch from and integrate with another repository or a local branch. Incorporates changes from a remote repository into the current branch.',
  args: {
    options: GitPullSchema.optional(),
  },
  async execute({ options = {} }) {
    const args = ['pull']
    
    if (options.remote) {
      args.push(options.remote)
    }
    if (options.branch) {
      args.push(options.branch)
    }
    if (options.rebase) {
      args.push('--rebase')
    }
    
    const result = await runGit(args, options.cwd)
    return JSON.stringify({ status: 'success', output: result })
  },
})

export const git_diff = tool({
  description: 'Show changes between commits, commit and working tree, etc. Used to see what has changed in the working directory or between commits.',
  args: {
    options: GitDiffSchema.optional(),
  },
  async execute({ options = {} }) {
    const args = ['diff']
    
    if (options.staged) {
      args.push('--cached')
    }
    if (options.stat) {
      args.push('--stat')
    }
    if (options.nameOnly) {
      args.push('--name-only')
    }
    if (options.file) {
      args.push('--', options.file)
    }
    
    const result = await runGit(args, options.cwd)
    return JSON.stringify({ status: 'success', output: result || 'No changes' })
  },
})

export const git_log = tool({
  description: 'Show commit logs. Lists commits in reverse chronological order, showing the hash, author, date, and message for each commit.',
  args: {
    options: GitLogSchema.optional(),
  },
  async execute({ options = {} }) {
    const args = ['log']
    
    if (options.maxCount) {
      args.push(`-n${options.maxCount}`)
    }
    if (options.oneline) {
      args.push('--oneline')
    }
    if (options.file) {
      args.push('--', options.file)
    }
    if (options.author) {
      args.push(`--author=${options.author}`)
    }
    args.push('--pretty=format:%h|%an|%ae|%ad|%s')
    
    const result = await runGit(args, options.cwd)
    const commits = result.trim().split('\n').filter(Boolean).map(line => {
      const [hash, author, email, date, message] = line.split('|')
      return { hash, author, email, date, message }
    })
    return JSON.stringify({ status: 'success', commits })
  },
})

export const git_add = tool({
  description: 'Add file contents to the index. Updates the index using the current content found in the working tree, to prepare the content staged for the next commit.',
  args: {
    options: GitAddSchema,
  },
  async execute({ options }) {
    const args = ['add', ...options.patterns]
    const result = await runGit(args, options.cwd)
    return JSON.stringify({ status: 'success', output: result || 'Files staged' })
  },
})

export const git_remote = tool({
  description: 'Manage set of tracked repositories. Used to add, remove, and query remote repositories.',
  args: {
    options: GitRemoteSchema.optional(),
  },
  async execute({ options = {} }) {
    const args: string[] = []
    
    if (options.verbose) {
      args.push('-v')
    }
    if (options.add) {
      args.push('add', options.add)
    }
    if (options.remove) {
      args.push('remove', options.remove)
    }
    
    const result = await runGit(args, options.cwd)
    return JSON.stringify({ status: 'success', output: result })
  },
})

export const git_fetch = tool({
  description: 'Download objects and refs from another repository. Fetches branches and tags from one or more repositories.',
  args: {
    options: GitOptionsSchema.extend({
      remote: z.string().optional().describe('Remote to fetch from'),
      all: z.boolean().optional().describe('Fetch all remotes'),
      prune: z.boolean().optional().describe('Remove stale remote-tracking branches'),
    }).optional(),
  },
  async execute({ options = {} }) {
    const args = ['fetch']
    
    if (options.remote) {
      args.push(options.remote)
    }
    if (options.all) {
      args.push('--all')
    }
    if (options.prune) {
      args.push('--prune')
    }
    
    const result = await runGit(args, options.cwd)
    return JSON.stringify({ status: 'success', output: result || 'Fetch complete' })
  },
})

export const git_checkout = tool({
  description: 'Switch branches or restore working tree files. Updates files in the working tree to match the version in the index or specified tree.',
  args: {
    options: GitOptionsSchema.extend({
      branch: z.string().describe('Branch to checkout'),
      createNew: z.boolean().optional().describe('Create and switch to new branch'),
      force: z.boolean().optional().describe('Force checkout, discarding changes'),
    }),
  },
  async execute({ options }) {
    const args = ['checkout']
    
    if (options.createNew) {
      args.push('-b', options.branch)
    } else if (options.force) {
      args.push('--force', options.branch)
    } else {
      args.push(options.branch)
    }
    
    const result = await runGit(args, options.cwd)
    return JSON.stringify({ status: 'success', output: result })
  },
})

export const git_merge = tool({
  description: 'Join two or more development histories together. Incorporates changes from the named commits into the current branch.',
  args: {
    options: GitOptionsSchema.extend({
      branch: z.string().describe('Branch to merge into current'),
      noFastForward: z.boolean().optional().describe('Create a merge commit even for fast-forward'),
      squash: z.boolean().optional().describe('Squash commits into one'),
    }),
  },
  async execute({ options }) {
    const args = ['merge']
    
    if (options.noFastForward) {
      args.push('--no-ff')
    }
    if (options.squash) {
      args.push('--squash')
    }
    args.push(options.branch)
    
    const result = await runGit(args, options.cwd)
    return JSON.stringify({ status: 'success', output: result })
  },
})

export const git_reset = tool({
  description: 'Reset current HEAD to the specified state. Can be used to unstage files, move the branch pointer, or reset the working tree.',
  args: {
    options: GitOptionsSchema.extend({
      mode: z.enum(['soft', 'mixed', 'hard']).optional().describe('Reset mode'),
      target: z.string().optional().describe('Reset target (commit, branch, or HEAD~n)'),
    }).optional(),
  },
  async execute({ options = {} }) {
    const args = ['reset']
    
    if (options.mode) {
      args.push(`--${options.mode}`)
    }
    if (options.target) {
      args.push(options.target)
    }
    
    const result = await runGit(args, options.cwd)
    return JSON.stringify({ status: 'success', output: result })
  },
})

export const git_stash = tool({
  description: 'Stash changes in a dirty working directory. Saves modified, staged, and untracked files for later use.',
  args: {
    options: GitOptionsSchema.extend({
      push: z.boolean().optional().describe('Stash changes'),
      pop: z.boolean().optional().describe('Apply and remove latest stash'),
      apply: z.boolean().optional().describe('Apply stash without removing'),
      list: z.boolean().optional().describe('List all stashes'),
      drop: z.boolean().optional().describe('Remove a stash'),
      clear: z.boolean().optional().describe('Remove all stashes'),
      message: z.string().optional().describe('Stash message'),
    }).optional(),
  },
  async execute({ options = {} }) {
    const args: string[] = ['stash']
    
    if (options.push) {
      args.push('push')
      if (options.message) {
        args.push('-m', options.message)
      }
    } else if (options.pop) {
      args.push('pop')
    } else if (options.apply) {
      args.push('apply')
    } else if (options.list) {
      args.push('list')
    } else if (options.drop) {
      args.push('drop')
    } else if (options.clear) {
      args.push('clear')
    } else {
      args.push('push')
    }
    
    const result = await runGit(args, options.cwd)
    return JSON.stringify({ status: 'success', output: result })
  },
})

export const git_show = tool({
  description: 'Show various types of objects. Displays commit information, tree objects, blobs, and tag information.',
  args: {
    options: GitOptionsSchema.extend({
      object: z.string().optional().describe('Object to show (commit, tag, etc.)'),
      stat: z.boolean().optional().describe('Show diffstat'),
      nameOnly: z.boolean().optional().describe('Show only file names'),
    }).optional(),
  },
  async execute({ options = {} }) {
    const args = ['show']
    
    if (options.object) {
      args.push(options.object)
    }
    if (options.stat) {
      args.push('--stat')
    }
    if (options.nameOnly) {
      args.push('--name-only')
    }
    
    const result = await runGit(args, options.cwd)
    return JSON.stringify({ status: 'success', output: result })
  },
})

export const git_tag = tool({
  description: 'Create, list, delete, or verify a tag object. Tags are named references to commits, often used to mark release points.',
  args: {
    options: GitOptionsSchema.extend({
      list: z.boolean().optional().describe('List tags'),
      create: z.string().optional().describe('Create a new tag'),
      delete: z.string().optional().describe('Delete a tag'),
      annotate: z.boolean().optional().describe('Create annotated tag'),
      message: z.string().optional().describe('Tag message'),
    }).optional(),
  },
  async execute({ options = {} }) {
    const args: string[] = ['tag']
    
    if (options.list) {
      args.push('-l')
    } else if (options.create) {
      if (options.annotate) {
        args.push('-a', options.create)
        if (options.message) {
          args.push('-m', options.message)
        }
      } else {
        args.push(options.create)
      }
    } else if (options.delete) {
      args.push('-d', options.delete)
    }
    
    const result = await runGit(args, options.cwd)
    return JSON.stringify({ status: 'success', output: result })
  },
})

export const git_rebase = tool({
  description: 'Reapply commits on top of another base tip. Replays commits from one branch onto another.',
  args: {
    options: GitOptionsSchema.extend({
      onto: z.string().optional().describe('Rebase onto specific branch'),
      interactive: z.boolean().optional().describe('Interactive rebase'),
      continue: z.boolean().optional().describe('Continue after resolving conflicts'),
      abort: z.boolean().optional().describe('Abort current rebase'),
      skip: z.boolean().optional().describe('Skip current patch'),
    }).optional(),
  },
  async execute({ options = {} }) {
    const args: string[] = ['rebase']
    
    if (options.onto) {
      args.push(options.onto)
    }
    if (options.interactive) {
      args.push('-i')
    }
    if (options.continue) {
      args.push('--continue')
    }
    if (options.abort) {
      args.push('--abort')
    }
    if (options.skip) {
      args.push('--skip')
    }
    
    const result = await runGit(args, options.cwd)
    return JSON.stringify({ status: 'success', output: result })
  },
})
