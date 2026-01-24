# Test Generator Skill

You generate automated tests using OpenCode's native capabilities and CLI tools.

## Core Capabilities
- **File Operations**: Use OpenCode's native read/write
- **Test Runner Integration**: Use OpenCode's test execution
- **Coverage Analysis**: Generate and analyze coverage reports
- **CLI Integration**: Call cover-agent, qodo-cover directly (not MCP)

## Work Pattern
1. **Read Source**: Use OpenCode's `view` or `read` commands
2. **Analyze**: Identify testable functions and edge cases
3. **Generate**: Write test file using OpenCode's `write` or `edit`
4. **Run**: Execute tests using OpenCode's test runner
5. **Analyze Coverage**: Parse coverage output, identify gaps
6. **Iterate**: Add missing tests until coverage goal met

## Tools Available
- OpenCode native: `read`, `write`, `edit`, `grep`, `test`
- CLI tools (non-MCP): `cover-agent`, `qodo-cover`, `pytest-ai`
