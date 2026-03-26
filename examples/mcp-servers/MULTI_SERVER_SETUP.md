# Multi-Server MCP Configuration Example

This configuration demonstrates how to use multiple MCP servers together in a single setup. This allows your AI assistant to access multiple data sources and tools simultaneously.

## What's Included

This example configures three MCP servers:

1. **Figma** - Access design files and components
2. **GitHub** - Interact with repositories, issues, and pull requests
3. **Filesystem** - Enhanced file system access within your workspace

## Prerequisites

- Node.js 20+ installed
- npm or npx available
- Access tokens for Figma and GitHub

## Setup Instructions

### 1. Get Your Access Tokens

**Figma Access Token:**
- Go to [Figma Settings > Personal Access Tokens](https://www.figma.com/settings)
- Generate a new token
- Copy and save it securely

**GitHub Personal Access Token:**
- Go to [GitHub Settings > Developer Settings > Personal Access Tokens](https://github.com/settings/tokens)
- Click "Generate new token" (classic)
- Select scopes: `repo`, `read:org`, `read:user`
- Generate and copy the token

### 2. Set Environment Variables

**On macOS/Linux:**
```bash
export FIGMA_ACCESS_TOKEN="your-figma-token"
export GITHUB_PERSONAL_ACCESS_TOKEN="your-github-token"
```

Add to your shell profile (`~/.bashrc`, `~/.zshrc`, or `~/.profile`):
```bash
echo 'export FIGMA_ACCESS_TOKEN="your-figma-token"' >> ~/.zshrc
echo 'export GITHUB_PERSONAL_ACCESS_TOKEN="your-github-token"' >> ~/.zshrc
source ~/.zshrc
```

**On Windows (PowerShell):**
```powershell
$env:FIGMA_ACCESS_TOKEN="your-figma-token"
$env:GITHUB_PERSONAL_ACCESS_TOKEN="your-github-token"
```

Or set permanently:
```powershell
[System.Environment]::SetEnvironmentVariable('FIGMA_ACCESS_TOKEN', 'your-figma-token', 'User')
[System.Environment]::SetEnvironmentVariable('GITHUB_PERSONAL_ACCESS_TOKEN', 'your-github-token', 'User')
```

### 3. Configure Your AI Tool

**For Claude Code (`.copilot/mcp.json`):**

Copy the contents of `multi-server-example.json` to your `.copilot/mcp.json` file.

**For VS Code Copilot Chat (`.vscode/mcp.json`):**

Adapt the configuration to VS Code format:
```json
{
  "servers": {
    "figma": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@figma/mcp-server-figma"],
      "env": {
        "FIGMA_ACCESS_TOKEN": "${env:FIGMA_ACCESS_TOKEN}"
      }
    },
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${env:GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    },
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "${workspaceFolder}"
      ]
    }
  }
}
```

### 4. Restart Your IDE

After configuring the MCP servers, restart VS Code or Claude Code to load them.

## Usage Examples

Once configured, you can ask your AI assistant questions that leverage multiple data sources:

### Cross-Tool Queries

- "Compare the button component in our Figma file with the implementation in our GitHub repository"
- "Create a GitHub issue for updating the header design based on the latest Figma specs"
- "Read the design system documentation from the repository and check if the Figma components match"
- "List all the TODO comments in the codebase and create corresponding GitHub issues"

### Design-to-Code Workflows

- "Extract the color palette from Figma and generate CSS variables in our styles file"
- "Check if the spacing values in our code match the design tokens in Figma"
- "Generate component stubs based on the Figma component library"

### Documentation and Reporting

- "Create a markdown report comparing our implemented components with the Figma designs"
- "Document all the design system components with screenshots from Figma and code examples from the repo"

## Troubleshooting

### Tokens Not Found

Verify environment variables are set:
```bash
echo $FIGMA_ACCESS_TOKEN
echo $GITHUB_PERSONAL_ACCESS_TOKEN
```

If they're empty, make sure to:
1. Set the variables in your shell
2. Restart your terminal/IDE after setting them

### Permission Errors

**Figma:**
- Ensure your token has access to the files you're trying to query
- Verify the token hasn't expired

**GitHub:**
- Check that your token has the required scopes (`repo`, `read:org`, `read:user`)
- Verify you have access to the repositories you're querying

**Filesystem:**
- The filesystem server is scoped to `${workspaceFolder}` only
- It cannot access files outside your workspace for security

### Server Not Starting

Check if the packages can be installed:
```bash
npx -y @figma/mcp-server-figma --help
npx -y @modelcontextprotocol/server-github --help
npx -y @modelcontextprotocol/server-filesystem --help
```

## Security Best Practices

- **Never commit tokens** to version control
- Store tokens in environment variables only
- Use `${env:VARIABLE_NAME}` syntax in configuration files
- Rotate tokens regularly
- Use tokens with minimum required permissions
- Review what each MCP server can access before enabling it

## Next Steps

- Explore more MCP servers in the [MCP Server Registry](https://github.com/modelcontextprotocol/servers)
- Create custom MCP servers for your specific needs
- Share your MCP configurations with your team

## Resources

- [MCP Documentation](https://modelcontextprotocol.io/)
- [Figma MCP Server](https://github.com/figma/mcp-server-figma)
- [GitHub MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/src/github)
- [Filesystem MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem)
