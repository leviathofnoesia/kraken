# Semantic Search Quick Reference

## Tools Available

| Tool | Purpose | Example |
|------|---------|---------|
| `semantic-search` | Semantic search by purpose | `semantic-search("user auth")` |
| `grep` | Pattern/text search | `grep("auth.*login")` |
| `glob` | File name patterns | `glob("**/*test*.ts")` |
| `read` | Read file contents | `read("/path/to/file")` |
| `semantic-search_impact` | Find callers of function | `semantic-search_impact("authenticate")` |
| `semantic-search_calls` | Find function calls | `semantic-search_calls("main")` |

## Quick Commands

### Find by Purpose
```
@semantic-search("authentication flow")
@semantic-search("database connection setup")
@semantic-search("API error handling")
```

### Find by Pattern
```
@grep("login|authenticate|credential")
@grep("SELECT.*FROM", {include: ["*.py", "*.sql"]})
@grep("router\\.(get|post)", {type: "ts"})
```

### Find Files
```
@glob("**/*controller*.ts")
@glob("**/config*.{json,yaml,yml}")
@glob("**/*test*.{js,ts,py}")
```

### Combine glob + grep
```
# Find test files for a module
glob("**/*auth*.ts")
grep("describe|test|it\\(", {include: ["**/*auth*.test.ts"]})
```

## Common Patterns

| Search | Query |
|--------|-------|
| Auth functions | `semantic-search("authentication")` |
| API routes | `grep("router\\.(get\|post\|put\|delete)")` |
| DB queries | `grep("SELECT\|INSERT\|UPDATE")` |
| Config files | `glob("**/config*.{json,yaml,yml}")` |
| Error handling | `grep("catch\|throw\|Error")` |
| Test files | `glob("**/*test*.{js,ts,py}")` |

## Cheat Sheet

```bash
# Search case-insensitive
grep("pattern", {case_sensitive: false})

# Include specific file types
grep("pattern", {include: ["*.ts", "*.js"]})

# Exclude directories
grep("pattern", {exclude: ["node_modules", "dist"]})

# Show line numbers
grep("pattern", {show_line_numbers: true})
```
