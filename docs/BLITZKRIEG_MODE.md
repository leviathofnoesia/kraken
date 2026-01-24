# Blitzkrieg Mode

Blitzkrieg Mode is an aggressive test-driven development workflow built into Kraken Code.

## Activation

Simply include "blitz" or "blz" in your request:
- "Use blitz to implement auth system"
- "Enable blz mode for this feature"
- "Refactor with blitzkrieg standards"

## Features

### Test Plan Enforcement
- Required before complex features
- Minimum test cases specified
- Coverage thresholds defined

### TDD Workflow
- Tests written before implementation
- No code without tests
- Refactoring allowed

### Evidence Verification
- Test execution evidence required
- Assertion count verified
- Edge cases checked

### Planner Constraints
- Test step required in plans
- Verification step required
- Complexity limits enforced

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
        "forceWriteTestFirst": true,
        "forbidCodeWithoutTest": true
      }
    }
  }
}
```
