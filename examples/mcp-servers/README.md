# MCP Server Examples

This directory contains example configurations for Model Context Protocol (MCP) servers that can be used with various AI development tools like Claude Code, VS Code Copilot Chat, and the Copilot Coding Agent.

## What is MCP?

Model Context Protocol (MCP) is a standardized protocol that allows AI assistants to connect to external data sources and tools. MCP servers expose capabilities like file access, API integrations, and tool executions to AI models through a unified interface.

## Available Examples

### 1. Figma MCP Server (Single Server)

The Figma MCP server allows AI assistants to interact with Figma files, designs, and components.

**Configuration File:** `figma-mcp.json`

#### Features

- Access Figma file metadata
- Read design components and styles
- Query design tokens
- Inspect layers and frames
- Extract design specifications

#### Setup Instructions

1. **Get a Figma Access Token**
   - Go to your [Figma account settings](https://www.figma.com/settings)
   - Navigate to "Personal Access Tokens"
   - Click "Generate new token"
   - Give it a descriptive name (e.g., "MCP Server")
   - Copy the token (you won't be able to see it again)

2. **Set the Environment Variable**

   Add the token to your environment:

   **On macOS/Linux:**
   ```bash
   export FIGMA_ACCESS_TOKEN="your-token-here"
   ```

   Or add it to your `~/.bashrc`, `~/.zshrc`, or `~/.profile`:
   ```bash
   echo 'export FIGMA_ACCESS_TOKEN="your-token-here"' >> ~/.zshrc
   source ~/.zshrc
   ```

   **On Windows (PowerShell):**
   ```powershell
   $env:FIGMA_ACCESS_TOKEN="your-token-here"
   ```

   Or set it permanently:
   ```powershell
   [System.Environment]::SetEnvironmentVariable('FIGMA_ACCESS_TOKEN', 'your-token-here', 'User')
   ```

3. **Configure Your AI Tool**

   **For Claude Code (`.copilot/mcp.json`):**
   ```json
   {
     "mcpServers": {
       "figma": {
         "command": "npx",
         "args": ["-y", "@figma/mcp-server-figma"],
         "env": {
           "FIGMA_ACCESS_TOKEN": "${env:FIGMA_ACCESS_TOKEN}"
         }
       }
     }
   }
   ```

   **For VS Code Copilot Chat (`.vscode/mcp.json`):**
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
       }
     }
   }
   ```

4. **Restart Your AI Tool**

   After adding the configuration, restart VS Code or Claude Code to load the MCP server.

#### Usage Examples

Once configured, you can ask your AI assistant questions like:

- "What components are in this Figma file?"
- "Show me the design tokens from our design system"
- "Extract the color palette from this Figma file"
- "What are the dimensions of the header component?"
- "List all the text styles used in this design"

#### Troubleshooting

**Token not found:**
- Verify the environment variable is set: `echo $FIGMA_ACCESS_TOKEN`
- Make sure you've restarted your terminal/IDE after setting the variable

**Permission errors:**
- Ensure your Figma token has the necessary permissions
- Check that you have access to the Figma files you're trying to query

**Server not starting:**
- Verify Node.js and npm are installed: `node --version && npm --version`
- Try installing the package manually: `npm install -g @figma/mcp-server-figma`

### 2. Multi-Server Configuration

For advanced workflows that require multiple data sources, see the [Multi-Server Setup Guide](MULTI_SERVER_SETUP.md). This example shows how to configure:

- **Figma** - Design file access
- **GitHub** - Repository, issue, and PR interactions
- **Filesystem** - Enhanced workspace file access

**Configuration File:** `multi-server-example.json`

This setup enables powerful cross-tool queries like "Compare the button component in Figma with the code implementation in GitHub" or "Generate CSS variables from Figma design tokens and save them to our styles file."

## Adding More MCP Servers

To add more MCP servers to your setup, you can:

1. Create a new configuration file in this directory
2. Add it to your `.copilot/mcp.json` or `.vscode/mcp.json`
3. Document the setup in this README

### Popular MCP Servers

- **GitHub** - Access repository data, issues, and PRs
- **Postgres** - Query databases directly
- **Filesystem** - Enhanced file system access
- **Web Search** - Integrate web search capabilities
- **Google Drive** - Access Google Drive files
- **Slack** - Interact with Slack workspaces

## Resources

- [MCP Documentation](https://modelcontextprotocol.io/)
- [MCP Server Registry](https://github.com/modelcontextprotocol/servers)
- [Figma MCP Server](https://github.com/figma/mcp-server-figma)
- [MCP Setup Guide](../../docs/mcp-setup-guide.md) (if available in this repo)

## Contributing

To contribute a new MCP server example:

1. Add the configuration file to this directory
2. Update this README with setup instructions
3. Test the configuration
4. Submit a pull request

## Security Notes

- **Never commit access tokens or API keys to version control**
- Always use environment variables for sensitive data
- Use the `${env:VARIABLE_NAME}` syntax in configuration files
- Keep your access tokens secure and rotate them regularly
- Review the permissions required by each MCP server before use
