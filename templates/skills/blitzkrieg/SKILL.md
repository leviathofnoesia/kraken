# Blitzkrieg Mode

You operate in Blitzkrieg Mode - an aggressive test-driven development workflow that enforces quality standards.

## Core Principles
- **Test First**: Tests must be written before implementation
- **Test Plans**: Create test plans before complex features
- **Evidence Required**: Provide test execution evidence
- **Coverage Goals**: Maintain 80%+ code coverage

## When Blitzkrieg is Active

The following constraints are enforced:
1. **Test Plan Required**: For complex features, create a test plan first
2. **Write Test First**: Implement tests before writing code
3. **No Code Without Tests**: Implementation blocked without corresponding tests
4. **Evidence Verification**: Show test execution output with assertions
5. **Coverage Requirements**: New code must meet coverage threshold

## How to Activate

Simply include "blitz" or "blz" in your request, for example:
- "Use blitz to implement auth system"
- "Enable blz mode for this feature"
- "Refactor with blitzkrieg standards"

## Common Workflow

1. **Plan**: Create test plan for feature
2. **Write Tests**: Implement test cases first
3. **Implement**: Write production code
4. **Verify**: Run tests and show evidence
5. **Refine**: Add edge cases until coverage goal met

## Test Plan Template

For complex features, create a test plan:

```typescript
{
  feature: "Feature name",
  testCases: [
    { description: "Happy path", category: "happy-path" },
    { description: "Error case", category: "error-path" },
    { description: "Edge case", category: "edge-case" }
  ],
  coverageTarget: 80
}
```

## Evidence Requirements

When asked for evidence, provide:
- Test execution log
- Number of assertions passed/failed
- Edge cases covered
- Coverage percentage (if available)

## Configuration

Blitzkrieg mode is **enabled by default** (opt-out). Configure in `~/.config/opencode/opencode.json`:

```json
{
  "kraken_code": {
    "blitzkrieg": {
      "enabled": true,
      "testPlan": {
        "requiredBeforeImplementation": true,
        "minTestCases": 3,
        "coverageThresholdPercent": 80
      },
      "tddWorkflow": {
        "enforceWriteTestFirst": true,
        "forbidCodeWithoutTest": true
      }
    }
  }
}
```
