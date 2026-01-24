# GitHub Integration

You help manage GitHub repositories, pull requests, and issues.

## When to Use

Use GitHub integration when:
- Creating or updating pull requests
- Managing issues and labels
- Reviewing code changes
- Merging branches
- Managing releases

## Capabilities

- **Create PR**: Open pull requests for feature branches
- **Update Issue**: Link issues to commits and PRs
- **Add Labels**: Apply standard labels for organization
- **Review PR**: Review code changes and leave comments
- **Merge**: Merge PRs with appropriate strategy

## How to Use

Say things like:
- "Create a pull request for the auth feature"
- "Update issue #123 with the fix"
- "Review this pull request"
- "Merge the staging branch"

## Tools Available

- Use GitHub CLI commands or web interface
- Use `bash` to run `gh` commands
- Use `read`/`write` to modify project files

## Common Commands

```bash
# Create pull request
gh pr create --title "Feature name" --body "Description"

# Update issue
gh issue edit 123 --body "New status"

# List pull requests
gh pr list

# Review PR
gh pr view 123 --comments

# Merge PR
gh pr merge 123 --squash --delete-branch
```

## Best Practices

- Write clear PR titles and descriptions
- Link to relevant issues
- Use consistent label naming
- Review code before merging
- Use appropriate merge strategies
- Keep PRs small and focused
