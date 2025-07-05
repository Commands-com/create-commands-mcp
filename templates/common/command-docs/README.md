# Test MCP Server Command

A comprehensive testing command for MCP servers created with create-commands-mcp. This command validates that your MCP server is properly configured and all tools are functioning correctly.

## Overview

This command tests the core functionality of MCP servers including:
- **Connectivity**: Verifies the server is accessible and responding
- **Authentication**: Confirms JWT tokens are being validated
- **Tool Execution**: Tests each available tool (ping, echo, datetime)
- **Parameter Handling**: Validates both required and optional parameters

## Usage

Use the `/test-mcp` command in Claude Code after adding your MCP server. The command provides several options to customize testing:

### Parameters

- **Test Type**: Choose which tests to run
  - `all` - Run all available tests (default)
  - `connectivity` - Test only the ping tool
  - `message` - Test only the echo tool
  - `datetime` - Test only the datetime tool

- **Echo Message**: Custom message for testing the echo tool
  - Default: "Hello from Commands.com! Testing MCP server."

- **Uppercase Echo**: Whether to test uppercase transformation
  - `yes` - Transform message to uppercase (default)
  - `no` - Keep original case

- **DateTime Format**: Which time formats to test
  - `all` - Test all formats (default)
  - `iso` - ISO 8601 format only
  - `unix` - Unix timestamp only
  - `readable` - Human-readable format only

## What Gets Tested

### 1. Ping Tool
- Server connectivity and responsiveness
- JWT authentication validation
- Server metadata (name, version, uptime)

### 2. Echo Tool
- Message input/output processing
- Parameter validation
- Text transformation capabilities
- Message length and word count calculation

### 3. DateTime Tool
- System time access
- Multiple format outputs
- Timezone handling
- Format parameter validation

## Expected Results

A successful test will confirm:
- ✅ All selected tools respond correctly
- ✅ JWT authentication is working
- ✅ Parameters are properly validated
- ✅ Response formats match specifications
- ✅ No errors or timeouts occur

## Troubleshooting

Common issues and solutions:

### Authentication Errors
- Verify `COMMANDS_JWT_ISSUER` is set to `https://api.commands.com`
- Check `COMMANDS_JWT_AUDIENCE` matches your server ID
- Ensure the server is receiving Authorization headers

### Connection Timeouts
- Confirm your server is deployed and accessible
- Check the proxy URL in your MCP configuration
- Verify Railway/Vercel deployment is running

### Tool Errors
- Review tool implementation matches the expected schema
- Check error logs for detailed error messages
- Ensure all required dependencies are installed

## Requirements

- MCP server created with create-commands-mcp
- Server deployed to Railway, Vercel, or similar platform
- Commands.com JWT authentication configured
- Claude Code with MCP support enabled

## Support

For issues or questions:
- [create-commands-mcp GitHub Issues](https://github.com/commands-com/create-commands-mcp/issues)
- [Commands.com Discord](https://discord.com/invite/snk8BEHfRd)
- [MCP Documentation](https://commands.com/docs/mcp)