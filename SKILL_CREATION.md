# Creating Custom Skills for Kraken Code

This guide explains how to create custom skills for Kraken Code.

## Basic Structure

A skill is a TypeScript file with a specific structure:

```typescript
// Import necessary dependencies
import { Skill } from "kraken-code"

// Define your skill
export const mySkill: Skill = {
  name: "My Skill",
  description: "A description of what this skill does",
  version: "1.0.0",
  
  // Define the skill's capabilities
  capabilities: {
    // Define what the skill can do
  },
  
  // Define the skill's configuration
  config: {
    // Default configuration
  },
  
  // Initialize the skill
  initialize: async (config) => {
    // Initialization logic
  },
  
  // Main skill logic
  execute: async (input, context) => {
    // Skill execution logic
  }
}
```

## Template Structure

Skills are organized in a template structure:

```
templates/
└── skills/
    ├── category1/
    │   ├── skill1.ts
    │   └── skill2.ts
    └── category2/
        └── skill3.ts
```

## Creating a New Skill

1. **Choose a category**: Create a new folder under `templates/skills/` for your skill category
2. **Create the skill file**: Create a `.ts` file with your skill implementation
3. **Implement the skill**: Follow the structure above
4. **Add to templates**: The skill will be automatically installed when Kraken Code is initialized

## Example: Simple Calculator Skill

```typescript
import { Skill } from "kraken-code"

export const calculator: Skill = {
  name: "Calculator",
  description: "Perform basic arithmetic operations",
  version: "1.0.0",
  
  capabilities: {
    add: true,
    subtract: true,
    multiply: true,
    divide: true
  },
  
  config: {
    precision: 2
  },
  
  initialize: async (config) => {
    console.log("Calculator skill initialized")
  },
  
  execute: async (input, context) => {
    const { operation, a, b } = input
    let result
    
    switch (operation) {
      case 'add':
        result = a + b
        break
      case 'subtract':
        result = a - b
        break
      case 'multiply':
        result = a * b
        break
      case 'divide':
        result = a / b
        break
      default:
        throw new Error(`Unknown operation: ${operation}`)
    }
    
    return {
      result: parseFloat(result.toFixed(config.precision)),
      operation,
      operands: { a, b }
    }
  }
}
```

## Testing Your Skill

1. **Unit tests**: Create tests in the `test/` directory
2. **Integration tests**: Test the skill in combination with other skills
3. **Documentation**: Document your skill's usage and capabilities

## Publishing Your Skill

1. **Add to skills directory**: Place your skill in the appropriate category
2. **Update documentation**: Add your skill to the skills documentation
3. **Test thoroughly**: Ensure your skill works as expected
4. **Submit PR**: Create a pull request to add your skill to the main repository

## Best Practices

- **Keep skills focused**: Each skill should have a single, clear purpose
- **Use TypeScript**: Leverage TypeScript for type safety
- **Add comprehensive tests**: Test all edge cases and error conditions
- **Provide good error messages**: Help users understand what went wrong
- **Document usage**: Include clear examples and explanations
- **Follow naming conventions**: Use descriptive names for skills and functions

## Advanced Features

### Skill Dependencies
Skills can depend on other skills:

```typescript
import { Skill } from "kraken-code"
import { calculator } from "../math/calculator"

export const advancedCalculator: Skill = {
  name: "Advanced Calculator",
  description: "Perform complex mathematical operations",
  version: "1.0.0",
  
  dependencies: [calculator],
  
  execute: async (input, context) => {
    // Use calculator skill
    const result = await context.execute(calculator, { operation: 'add', a: 1, b: 2 })
    return result
  }
}
```

### Skill Configuration
Skills can accept configuration:

```typescript
export const mySkill: Skill = {
  name: "My Skill",
  description: "A configurable skill",
  version: "1.0.0",
  
  config: {
    apiKey: "",
    timeout: 5000,
    enabled: true
  },
  
  initialize: async (config) => {
    if (!config.apiKey) {
      throw new Error("API key is required")
    }
  }
}
```

### Skill Metadata
Add additional metadata to your skills:

```typescript
export const mySkill: Skill = {
  name: "My Skill",
  description: "A skill with metadata",
  version: "1.0.0",
  
  metadata: {
    author: "Your Name",
    license: "MIT",
    tags: ["math", "utility"],
    requires: ["node >= 14"]
  }
}
```

## Troubleshooting

### Common Issues

- **Skill not found**: Check that your skill is in the correct directory
- **Type errors**: Ensure all TypeScript types are correctly defined
- **Initialization errors**: Check your initialize function for errors
- **Execution errors**: Handle errors gracefully in your execute function

### Debugging

Use the `--verbose` flag when initializing or running skills to get detailed output:

```bash
kraken-code init --verbose
opencode --verbose
```

## Contributing

When you create a new skill, please:

1. Add it to the appropriate category
2. Update the documentation
3. Add tests
4. Follow the coding standards
5. Submit a pull request

Happy coding!