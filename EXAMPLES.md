# Kraken Code Examples

Practical examples and workflows for using Kraken Code.

## Quick Start Examples

### Example 1: Setting Up a New Project

```bash
# 1. Create project directory
mkdir my-new-project && cd my-new-project

# 2. Initialize with Bun (or npm)
bun init -y

# 3. Install Kraken Code
bun install kraken-code

# 4. Initialize Kraken Code with full setup
kraken-code init --full

# 5. Start OpenCode
opencode
```

Now you're ready with all Kraken features enabled!

### Example 2: Using a Specific Agent

```bash
# Use Atlas for planning
opencode run --agent Atlas "Plan a REST API for a todo app"

# Use Nautilus for exploration
opencode run --agent Nautilus "Find all API endpoints in this codebase"

# Use Scylla for testing
opencode run --agent Scylla "Test the authentication system"
```

---

## Feature-Specific Examples

### Kratos Memory Examples

#### Save a Decision

```bash
opencode run "Save to Kratos: We decided to use PostgreSQL for the database because it has better JSON support and indexing for our queries."
```

#### Search Past Memories

```bash
opencode run "Search Kratos for: what database did we choose and why?"

opencode run "What did Kratos learn about authentication patterns?"

opencode run "Ask Kratos: what decisions have we made about error handling?"
```

#### Get Recent Memories

```bash
opencode run "Show me recent memories from Kratos"

opencode run "What have I learned in the last week?"
```

### Blitzkrieg TDD Examples

#### Starting a New Feature

```bash
# Blitzkrieg will enforce test plan first
opencode run "Implement user registration"

# Blitzkrieg response: "Please provide a test plan first..."
```

#### Provide Test Plan

```bash
opencode run "Test plan for user registration:
1. Test email validation (valid/invalid formats)
2. Test password strength requirements
3. Test duplicate email detection
4. Test successful registration
5. Test database storage
6. Test email confirmation sending"
```

#### Implement with TDD

```bash
# After test plan is approved
opencode run "Now implement the registration endpoint"

# Blitzkrieg will:
# 1. Remind you to write tests first
# 2. Verify tests pass
# 3. Check evidence (test results)
```

### Agent Examples

#### Atlas: Planning

```bash
# Break down a complex feature
opencode run --agent Atlas "Break down building a real-time chat application into manageable steps"

# Atlas will provide structured plan:
# - Frontend components (chat window, message list, user list)
# - Backend WebSocket server
# - Database schema (messages, users, rooms)
# - Authentication integration
# - Testing strategy
```

#### Nautilus: Exploration

```bash
# Find patterns in code
opencode run --agent Nautilus "Find all async functions that don't handle errors"

# Explore architecture
opencode run --agent Nautilus "Show me the data flow from API to database"

# Find similar implementations
opencode run --agent Nautilus "Find patterns similar to how we handle file uploads"
```

#### Abyssal: Deep Analysis

```bash
# Debug complex issue
opencode run --agent Abyssal "Investigate why memory usage increases over time"

# Analyze performance
opencode run --agent Abyssal "Analyze why this endpoint takes 5 seconds"

# Review architecture decision
opencode run --agent Abyssal "Analyze the implications of using event sourcing"
```

#### Coral: UI Construction

```bash
# Build a component
opencode run --agent Coral "Build a responsive navigation bar with dropdown menus"

# Improve existing UI
opencode run --agent Coral "Improve the user experience of the login form"

# Add visual features
opencode run --agent Coral "Add loading states and error animations to the data table"
```

#### Siren: Documentation

```bash
# Write API docs
opencode run --agent Siren "Write API documentation for the user endpoints"

# Update README
opencode run --agent Siren "Update the project README with setup instructions"

# Create guides
opencode run --agent Siren "Create a getting started guide for new developers"
```

#### Scylla: Testing

```bash
# Write comprehensive tests
opencode run --agent Scylla "Write tests for the payment processing module"

# Improve test coverage
opencode run --agent Scylla "Analyze test coverage and add missing tests"

# Test edge cases
opencode run --agent Scylla "Test all error scenarios in the API"
```

#### Pearl: Refactoring

```bash
# Refactor for performance
opencode run --agent Pearl "Optimize the database query for better performance"

# Improve code quality
opencode run --agent Pearl "Refactor the user service to reduce coupling"

# Apply patterns
opencode run --agent Pearl "Apply the factory pattern to the service creation"
```

#### Maelstrom: First-Principles

```bash
# Solve hard problem
opencode run --agent Maelstrom "How can we design a system that handles 1M concurrent users?"

# Analyze from first principles
opencode run --agent Maelstrom "What's the fundamental limit of our current architecture?"

# Explore alternatives
opencode run --agent Maelstrom "Consider alternative approaches to state management"
```

#### Leviathan: Large-Scale

```bash
# Plan refactor
opencode run --agent Leviathan "Plan a refactor to migrate from monolith to microservices"

# Coordinate multi-team changes
opencode run --agent Leviathan "Coordinate API changes across 5 services"

# Design system architecture
opencode run --agent Leviathan "Design the architecture for a multi-tenant SaaS platform"
```

#### Poseidon: Infrastructure

```bash
# Setup CI/CD
opencode run --agent Poseidon "Setup GitHub Actions for automated testing and deployment"

# Design data pipeline
opencode run --agent Poseidon "Design a data pipeline for processing analytics events"

# Configure infrastructure
opencode run --agent Poseidon "Setup database replication and backups"
```

---

## Workflow Examples

### Workflow 1: Feature Development (Blitzkrieg + Kratos)

```bash
# 1. Plan with Atlas
opencode run --agent Atlas "Plan a comment system for blog posts"

# 2. Save decisions to Kratos
opencode run "Save to Kratos: Decided to use nested comments with max depth of 5"

# 3. Write test plan (Blitzkrieg enforced)
opencode run "Test plan for comment system:
- Create comment
- Reply to comment
- Validate nesting depth
- Test pagination
- Test moderation flags"

# 4. Write tests (Scylla)
opencode run --agent Scylla "Write tests for the comment API"

# 5. Implement
opencode run "Implement the comment endpoints"

# 6. Verify (Blitzkrieg checks test evidence)
# Blitzkrieg will verify all tests pass

# 7. Document (Siren)
opencode run --agent Siren "Write API documentation for comments"
```

### Workflow 2: Debugging (Nautilus + Abyssal)

```bash
# 1. Search for similar issues
opencode run "Search Kratos for: slow query problems we've solved before"

# 2. Explore codebase
opencode run --agent Nautilus "Find all database queries in the user service"

# 3. Deep analysis
opencode run --agent Abyssal "Investigate why the user list endpoint is slow"

# 4. Refactor for performance
opencode run --agent Pearl "Optimize the user query with proper indexes"

# 5. Save the solution
opencode run "Save to Kratos: Slow query fixed by adding compound index on (created_at, status)"
```

### Workflow 3: Code Review (Nautilus + Scylla + Pearl)

```bash
# 1. Explore changes
opencode run --agent Nautilus "Show me the changes in the PR #123"

# 2. Test the changes
opencode run --agent Scylla "Review test coverage for the new payment flow"

# 3. Code quality check
opencode run --agent Pearl "Review the code for potential improvements and refactoring opportunities"

# 4. Save decisions
opencode run "Save to Kratos: Approved PR #123 with suggestion to extract the payment validator"
```

### Workflow 4: Onboarding (Siren + Atlas + Kratos)

```bash
# 1. Create documentation
opencode run --agent Siren "Create an onboarding guide for new developers"

# 2. Plan onboarding tasks
opencode run --agent Atlas "Break down onboarding into tasks:
1. Setup development environment
2. Run the application
3. Make first contribution
4. Understand architecture
5. Learn workflows"

# 3. Save common questions to Kratos
opencode run "Save to Kratos: New developers often ask about how to run tests - answer: use 'bun test'"

# 4. Create knowledge base
opencode run "Save to Kratos: Project uses PostgreSQL, Redis, and RabbitMQ. All services communicate via REST APIs."
```

---

## Mode Examples

### Blitzkrieg Mode

```bash
# Enable Blitzkrieg for strict TDD
opencode run "Enable Blitzkrieg mode for this session"

# Now all tasks will enforce TDD
opencode run "Create a new endpoint for user profiles"
# Blitzkrieg: "Please provide a test plan first..."
```

### Search Mode

```bash
# Use Search mode for codebase exploration
opencode run "Enable Search mode"

# Nautilus will auto-fire on patterns
opencode run "Find security vulnerabilities in the code"
# Nautilus auto-searches for common security patterns
```

### Analyze Mode

```bash
# Enable deep analysis
opencode run "Enable Analyze mode"

# 100+ language keyword detection enabled
opencode run "Review this code for issues"
# Analyzes JavaScript, TypeScript, Python, and more
```

### Ultrathink Mode

```bash
# Maximum reasoning for complex problems
opencode run "Enable Ultrathink mode"

opencode run "Design a system that can handle 10 million concurrent users"
# Deep, thorough reasoning with expanded context
```

---

## MCP Integration Examples

### Websearch MCP

```bash
# Search for solutions
opencode run "Use websearch to find best practices for React state management"

# Research libraries
opencode run "Search web for comparison between Jest and Vitest"
```

### Context7 MCP

```bash
# Look up official docs
opencode run "Use Context7 to find TypeScript utility types documentation"

# Get specific information
opencode run "Look up React useEffect documentation"
```

### Grep App MCP

```bash
# Search GitHub for examples
opencode run "Use grep-app to find examples of Express middleware for authentication"

# Find implementations
opencode run "Search GitHub for Redis connection pooling examples"
```

---

## Skill Examples

### Using Built-in Skills

```bash
# Use a skill from templates
opencode run --skill testing-coverage "Analyze and improve test coverage"

# Use git integration skill
opencode run --skill git-master "Review the git history and find the commit that introduced the bug"
```

### Creating a Custom Skill

1. Create skill directory:
```bash
mkdir -p ~/.config/opencode/skill/team-conventions
```

2. Create `SKILL.md`:
```markdown
# Team Conventions

Enforce our team's coding conventions.

## Code Style

- Use functional components with hooks
- Prefer composition over inheritance
- Keep components under 200 lines
- Use TypeScript strict mode

## Commit Messages

Format: `type(scope): description`

Types: feat, fix, docs, style, refactor, test, chore

## Review Checklist

- [ ] Tests pass
- [ ] TypeScript strict
- [ ] No console.log
- [ ] Proper error handling
```

3. Use the skill:
```bash
opencode run --skill team-conventions "Review this pull request"
```

---

## Integration Examples

### With GitHub

```bash
# Create PR
opencode run --agent Siren "Create a pull request description for the authentication refactor"

# Review PR
opencode run --agent Scylla "Review PR #42 for test coverage"

# Search issues
opencode run "Search GitHub for similar issues"
```

### With Git

```bash
# View diff
opencode run "Show me the git diff for the current changes"

# Find responsible commit
opencode run "Use git blame to find who introduced this code"

# Create commit message
opencode run --agent Siren "Write a good commit message for these changes"
```

### With LSP

```bash
# Get hover info
opencode run "Show me the documentation for this function"

# Find references
opencode run "Find all references to the UserService class"

# Rename symbol
opencode run "Rename the UserController to AdminController"
```

---

## Session Management Examples

### List Sessions

```bash
opencode session list
```

### Read Session History

```bash
opencode session read sess_abc123
```

### Search Sessions

```bash
opencode session search "authentication"
```

### Continue Previous Session

```bash
opencode run --session sess_abc123 "Continue where we left off"
```

---

## CLI Command Examples

### Check System Health

```bash
kraken-code doctor
```

### Check Specific Category

```bash
kraken-code doctor -c agents
kraken-code doctor -c blitzkrieg
kraken-code doctor -c kratos
```

### Show Configuration

```bash
kraken-code status
```

### Initialize with Minimal Setup

```bash
kraken-code init --minimal
```

---

## Real-World Scenarios

### Scenario 1: New Developer Onboarding

```bash
# 1. Explore codebase
opencode run --agent Nautilus "Give me an overview of the project structure"

# 2. Understand architecture
opencode run "Search Kratos for: architecture decisions"

# 3. Learn workflows
opencode run "What are the team's conventions for code review?"

# 4. Run tests
opencode run --agent Scylla "How do I run the test suite?"

# 5. Make first contribution
opencode run --agent Atlas "Plan a small feature to implement"
```

### Scenario 2: Production Bug

```bash
# 1. Search for similar issues
opencode run "Search Kratos for: authentication timeout errors"

# 2. Analyze the error
opencode run --agent Abyssal "Investigate why the login endpoint is timing out in production"

# 3. Explore related code
opencode run --agent Nautilus "Find all code related to session management"

# 4. Write fix with tests
opencode run --agent Scylla "Write tests for the timeout fix"
opencode run "Implement the fix"

# 5. Save to Kratos
opencode run "Save to Kratos: Fixed login timeout by increasing session cache TTL to 1 hour"
```

### Scenario 3: Architecture Decision

```bash
# 1. Analyze requirements
opencode run --agent Maelstrom "Analyze requirements for implementing real-time notifications"

# 2. Explore options
opencode run "Search web for comparison: WebSockets vs Server-Sent Events vs Polling"

# 3. Make decision
opencode run --agent Leviathan "Recommend an architecture for real-time notifications"

# 4. Document decision
opencode run --agent Siren "Write an ADR (Architecture Decision Record) for real-time notifications"

# 5. Save to Kratos
opencode run "Save to Kratos: Chose WebSockets with Redis pub/sub for real-time notifications"
```

### Scenario 4: Performance Optimization

```bash
# 1. Identify bottlenecks
opencode run --agent Abyssal "Analyze performance issues in the dashboard"

# 2. Explore slow code
opencode run --agent Nautilus "Find all database queries without indexes"

# 3. Optimize
opencode run --agent Pearl "Optimize the slow queries with proper indexing"

# 4. Test improvements
opencode run --agent Scylla "Write performance tests for the dashboard"

# 5. Verify
opencode run "Run performance tests and measure improvement"
```

### Scenario 5: Migrating to New Tech

```bash
# 1. Plan migration
opencode run --agent Leviathan "Plan migration from REST API to GraphQL"

# 2. Understand existing code
opencode run --agent Nautilus "Find all API endpoints and their dependencies"

# 3. Implement step-by-step
opencode run --agent Atlas "Break down the migration into phases"

# 4. Test each phase
opencode run --agent Scylla "Write integration tests for GraphQL endpoints"

# 5. Document
opencode run --agent Siren "Write migration guide and API documentation"

# 6. Save lessons learned
opencode run "Save to Kratos: GraphQL migration completed successfully. Key lessons: start with read-only queries, maintain REST API during transition"
```

---

## Tips & Best Practices

### 1. Use Kratos Proactively

Don't wait to be asked - save important decisions:

```bash
opencode run "Save to Kratos: [important decision]"
```

### 2. Choose the Right Agent

Match the task to the specialist:

- Planning → Atlas
- Exploring → Nautilus
- Debugging → Abyssal
- Building → Coral
- Testing → Scylla
- Refactoring → Pearl

### 3. Enable Blitzkrieg for Production

Use Blitzkrieg for production code:

```bash
opencode run "Enable Blitzkrieg mode"
```

### 4. Leverage Context Pruning

Let DCP handle context automatically - it saves ~70% tokens!

### 5. Search Before Creating

Always search Kratos and sessions first:

```bash
opencode run "Search Kratos for: [topic]"
opencode run session search "[keyword]"
```

### 6. Use Modes Appropriately

- **Blitzkrieg** - Production code
- **Search** - Codebase exploration
- **Analyze** - Deep debugging
- **Ultrathink** - Complex architecture

### 7. Create Skills for Repeated Workflows

If you do something repeatedly, create a skill:

```bash
mkdir ~/.config/opencode/skill/my-workflow
# Create SKILL.md
```

---

## Getting Help

- Check [FAQ.md](FAQ.md) for common questions
- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for issues
- Run diagnostics: `kraken-code doctor --verbose`
- Open an issue on GitHub

Happy coding with Kraken! 🦞
