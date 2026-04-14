import { describe, expect, test } from 'bun:test'
import { formatCiReviewMarkdown, parseDiffStat } from './ci'

describe('ci review helpers', () => {
  test('parseDiffStat parses git shortstat output', () => {
    const summary = parseDiffStat(' 3 files changed, 12 insertions(+), 4 deletions(-)', [
      'src/a.ts',
      'src/b.ts',
      'README.md',
    ])

    expect(summary.filesChanged).toBe(3)
    expect(summary.insertions).toBe(12)
    expect(summary.deletions).toBe(4)
  })

  test('formatCiReviewMarkdown includes refs and file list', () => {
    const md = formatCiReviewMarkdown('origin/main', 'HEAD', {
      filesChanged: 2,
      insertions: 10,
      deletions: 1,
      fileList: ['src/x.ts', 'src/y.ts'],
    })

    expect(md).toContain('origin/main')
    expect(md).toContain('src/x.ts')
    expect(md).toContain('Files changed')
  })
})
