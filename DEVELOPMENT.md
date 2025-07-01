# Development Guide

This document explains how to work on the `create-commands-mcp` scaffolding tool itself.

## Setup

```bash
git clone <repository>
cd create-commands-mcp
npm install
```

## Local Development

### Testing the Scaffolding Tool

```bash
# Build the tool
npm run build

# Test locally (creates a test project)
node dist/index.js test-project

# Or run in development mode
npm run dev test-project
```

### Testing Generated Projects

```bash
# Create a test project
npm run dev my-test-server

# Test the generated project
cd my-test-server
npm install
npm run doctor
npm run test
npm run dev
```

## Template Structure

```
templates/
├── common/           # Shared files across all templates
│   ├── package.json  # Base package.json with placeholders
│   ├── src/
│   │   ├── index.ts  # Main server implementation
│   │   ├── types.ts  # MCP protocol types
│   │   └── auth/     # JWT validation
│   └── tests/        # Basic test setup
├── basic/            # Basic template (3 simple tools)
├── api/              # API integration template
├── data/             # Data processing template
└── deployments/      # Deployment configurations
    ├── railway/
    ├── vercel/
    └── docker/
```

## Template Development

### Adding a New Template

1. Create directory: `templates/my-template/`
2. Add `src/tools/index.ts` with tool exports
3. Create individual tool files
4. Update main `src/index.ts` to include new template

### Adding a New Tool

```typescript
// templates/[template]/src/tools/mytool.ts
import { Tool } from '../types';

export const myTool: Tool = {
  name: 'my_tool',
  description: 'Description of what the tool does',
  inputSchema: {
    type: 'object',
    properties: {
      input: { type: 'string', description: 'Input parameter' }
    },
    required: ['input']
  },
  handler: async (args: { input: string }) => {
    return { result: args.input };
  }
};
```

### Template Variables

Use `{{variable}}` syntax in template files:

- `{{name}}` - Project name
- `{{description}}` - Project description  
- `{{author_name}}` - Author name
- `{{author_email}}` - Author email

## Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
# Test template generation
npm run test:templates

# Test generated project functionality
npm run test:integration
```

### Manual Testing

```bash
# Test basic template
npm run dev test-basic -- --template=basic

# Test API template  
npm run dev test-api -- --template=api

# Test data template
npm run dev test-data -- --template=data
```

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag
4. Publish to npm: `npm publish`

## Common Issues

### Template File Not Found
- Ensure template files exist in correct directory structure
- Check that file paths in `copyTemplate()` are correct

### Placeholder Not Replaced
- Verify `{{placeholder}}` syntax is used correctly
- Check `updateProjectFiles()` includes the file

### Generated Project Fails
- Test generated project manually
- Check that all required dependencies are in template `package.json`
- Verify TypeScript configuration is correct

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

### Code Style

- Use TypeScript strict mode
- Follow existing error handling patterns
- Add JSDoc comments for public functions
- Use descriptive variable names

### Testing Guidelines

- Add unit tests for new functions
- Test both success and error cases
- Include integration tests for new templates
- Test generated projects work correctly