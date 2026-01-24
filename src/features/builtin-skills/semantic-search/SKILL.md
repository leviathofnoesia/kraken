---
name: semantic-search
description: >
  Semantic and pattern-based code search using multiple strategies.
  Finds code by function name, purpose, patterns, and code structure.
  Use when you need to understand where and how specific functionality
  is implemented across the codebase.
---
# Semantic Search Skill

## When to Use

- Finding all usages of a function or method
- Searching for code patterns (error handling, loops, etc.)
- Locating implementations by purpose rather than exact text
- Finding files by content patterns
- Codebase exploration and architecture discovery
- Identifying refactoring targets

## Search Strategies

### 1. Semantic Search (Function/Purpose)

Use `semantic-search` for natural language queries about code:

```
Find all functions that handle authentication
Where is the database connection configured?
How is the API error handling implemented?
```

### 2. Pattern Search (grep)

Use `grep` for exact text patterns and regex:

```bash
# Find function definitions
grep -n "func.*authenticate" .

# Find error handling patterns
grep -rn "try.*catch\|except\|throw" .

# Find specific imports
grep -rn "from.*import\|require(" .
```

### 3. File Pattern Search (glob)

Use `glob` to find files by name patterns:

```bash
# Find all test files
glob("**/*test*.{js,ts,py}")

# Find configuration files
glob("**/*config*.{json,yaml,yml}")

# Find all TypeScript files
glob("**/*.ts")
```

### 4. Code Structure Search (semantic-search_dfg/semantic-search_cfg)

Use for data flow and control flow analysis:

```
Trace how user input flows through authentication
What functions call the main API handler?
```

## Step-by-Step Guidance

### Quick Search (Most Common)

1. **Start with semantic search** - Ask what you're looking for:
   ```
   semantic-search("user authentication flow")
   ```

2. **Refine with grep** if you know the pattern:
   ```
   grep("login|authenticate|credential", {include: ["*.ts", "*.js"]})
   ```

3. **Locate the files** and read them:
   ```
   glob("**/auth*.ts")
   read("/path/to/auth.ts")
   ```

### Deep Search (Architecture Discovery)

1. **Search for main entry points**:
   ```
   semantic-search("main function entry point app startup")
   ```

2. **Trace dependencies**:
   ```
   semantic-search_impact("main")
   ```

3. **Explore related modules**:
   ```
   grep("import.*from.*auth", {type: "ts"})
   ```

### Pattern-Based Search

1. **Identify the pattern type**:
   - API endpoints: `router|route|get\(|post\(|api\.`
   - Database queries: `query|select|insert|update`
   - Error handling: `catch|except|throw|error`

2. **Search with grep**:
   ```
   grep("router\\.(get|post|put|delete)", {type: "ts"})
   ```

3. **Filter results**:
   ```
   grep("SELECT.*FROM", {include: ["*.py", "*.sql"]})
   ```

## Search Combinations

### Find Files Then Search Content

```bash
# 1. Find relevant files
glob("**/*controller*.ts")

# 2. Search within those files
grep("authenticate", {paths: ["/found/files"]})
```

### Multi-Pattern Search

```bash
# Find files containing multiple patterns
grep("(auth|login|credential)", {include: ["*.ts", "*.js"]})
```

### Exclude Patterns

```bash
# Search excluding node_modules and tests
grep("password|secret|api_key", {exclude: ["node_modules", "**/*test*"]})
```

## Output Interpretation

### semantic-search Results

Returns structured information:
- Function/class definitions
- File paths and line numbers
- Brief descriptions of what code does

### grep Results

Returns matching lines with:
- File path
- Line number
- Matching content

### glob Results

Returns array of file paths matching the pattern

## Best Practices

1. **Start broad, narrow down** - Begin with semantic search, refine with patterns
2. **Use file type filters** - Limit searches to relevant file types
3. **Exclude non-source** - Skip node_modules, build artifacts, tests when exploring
4. **Combine strategies** - Use glob + grep for targeted searching
5. **Check imports** - Understanding imports reveals dependencies

## Common Search Patterns

### Finding API Endpoints
```
grep("router\\.(get|post|put|delete|patch)", {type: "ts"})
```

### Finding Database Operations
```
grep("(SELECT|INSERT|UPDATE|DELETE).*FROM", {type: "ts"})
```

### Finding Error Handling
```
grep("catch|throw|Error\\(|new Error", {include: ["*.ts", "*.js"]})
```

### Finding Configuration
```
glob("**/{config,settings}.{json,yaml,yml,js,ts}")
```

### Finding Tests for a File
```
glob("**/*" + baseName + "*.test.{js,ts}")
```

## Resources

- [ripgrep cheatsheet](https://cheat.sh/ripgrep)
- [glob pattern syntax](https://docs.python.org/3/library/glob.html)
- [OpenCode TUI Tools](/tools)

## Related Skills

- `git-master` - Git operations and history exploration
- `code-analyzer` - Deep code analysis and refactoring
- `test-generator` - Generate tests for found code
