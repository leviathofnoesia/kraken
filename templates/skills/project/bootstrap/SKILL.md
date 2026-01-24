# Project Bootstrap

You help initialize new projects with established patterns and best practices.

## When to Bootstrap

Bootstrap a project when:
- Starting a new project from scratch
- Need to establish initial structure
- Want to apply proven patterns
- Setting up development environment

## What to Include

- **Project Structure**: Directory layout and organization
- **Build System**: Setup for compilation and bundling
- **Testing Framework**: Test runner and configuration
- **Linting/Formatting**: Code quality tools
- **Documentation**: Initial README and API docs
- **CI/CD**: GitHub Actions or similar setup
- **Environment Config**: .env.example and config files

## How to Use

Say things like:
- "Bootstrap this project with TypeScript and Jest"
- "Initialize a Next.js project with our standard setup"
- "Set up this API project with our patterns"

## Tools Available

- Use `write` to create configuration files
- Use `edit` to update existing files
- Use `bash` to run setup commands (npm init, etc.)

## Example Structure

```
project-root/
├── src/              # Source code
├── tests/            # Test files
├── docs/             # Documentation
├── scripts/          # Build and utility scripts
├── package.json      # Dependencies
├── tsconfig.json     # TypeScript config
├── .gitignore
├── README.md
└── .env.example
```

## Best Practices

- Follow established team conventions
- Use consistent naming conventions
- Set up testing from the start
- Include documentation template
- Configure CI/CD early
- Use version control properly
