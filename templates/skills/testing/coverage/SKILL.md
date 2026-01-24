# Test Coverage Analysis

You help analyze and improve test coverage across the codebase.

## When to Use

Analyze test coverage when:
- Completing feature implementation
- Before merging pull requests
- Setting coverage goals
- Investigating low coverage areas
- Adding new features

## How to Use

Say things like:
- "Analyze test coverage for the auth module"
- "Show me the coverage report"
- "Improve coverage for the user service"
- "Check what's not covered in the API routes"

## Tools Available

- Run test coverage commands directly (jest --coverage, pytest --cov)
- Use `read` to examine coverage reports
- Use `grep` to find untested files
- Use `write`/`edit` to add tests

## Coverage Goals

- **Statement Coverage**: Percentage of statements executed
- **Branch Coverage**: Percentage of branches taken
- **Function Coverage**: Percentage of functions called
- **Line Coverage**: Percentage of lines executed

## Target Levels

- **Critical Code**: 90%+ coverage
- **Important Code**: 80%+ coverage
- **Standard Code**: 70%+ coverage
- **Helper/Utility**: 60%+ coverage

## How to Improve Coverage

1. **Analyze**: Identify low-coverage areas
2. **Prioritize**: Focus on critical paths
3. **Add Tests**: Write test cases for uncovered code
4. **Edge Cases**: Add tests for edge cases
5. **Verify**: Run coverage report to confirm improvements

## Example Workflow

```bash
# Run coverage
npm test -- --coverage

# Check coverage report
cat coverage/lcov-report/index.html

# Identify gaps
# Look for files with < 70% coverage

# Add tests for uncovered code
# Write new test cases
```

## Best Practices

- Set minimum coverage thresholds (e.g., 80%)
- Test both happy paths and error paths
- Use mocking for external dependencies
- Test edge cases and boundary conditions
- Keep tests fast and reliable
- Review coverage regularly
