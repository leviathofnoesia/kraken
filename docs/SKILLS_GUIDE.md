# Skills Guide

Skills in Kraken Code use natural language to guide the AI for specific tasks.

## Available Skills

### Memory Skills
- **Remember**: Store important information in Kratos
- **Recall**: Retrieve stored memories

### Session Skills
- **Summary**: Generate session summaries

### Project Skills
- **Bootstrap**: Initialize new projects with patterns
- **Init**: Set up project structure

### Git Skills
- **GitHub Integration**: Manage PRs and issues
- **Import Pattern**: Apply code patterns

### Testing Skills
- **Coverage**: Analyze and improve test coverage

### Code Skills
- **Code Analyzer**: Analyze code structure
- **Code Simplifier**: Simplify complex code
- **Video Generator**: Create documentation videos
- **Blitzkrieg**: Aggressive TDD workflow

## Using Skills

Simply describe what you want in natural language:
- "Remember that JWT expiration policy"
- "Recall authentication patterns"
- "Generate a session summary"
- "Create tests for the auth module"

The AI will automatically select and apply the appropriate skill.

## Skill Auto-Loading

Skills are automatically loaded from:
- `~/.config/opencode/skill/` - User's custom skills
- `~/.config/opencode/kraken-code/templates/skills/` - Built-in skills
