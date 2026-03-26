# MCP Quick Start Guide

## What You'll Need

1. **Figma Access Token** - Get from [Figma Settings](https://www.figma.com/settings)
2. **GitHub Token** (optional) - Get from [GitHub Settings](https://github.com/settings/tokens)
3. **Node.js 20+** - Check with `node --version`

## Quick Setup (Figma Only)

### Step 1: Get Figma Token
```
1. Go to https://www.figma.com/settings
2. Click "Personal Access Tokens"
3. Generate new token
4. Copy the token
```

### Step 2: Set Environment Variable

**macOS/Linux:**
```bash
export FIGMA_ACCESS_TOKEN="your-token"
echo 'export FIGMA_ACCESS_TOKEN="your-token"' >> ~/.zshrc
```

**Windows:**
```powershell
$env:FIGMA_ACCESS_TOKEN="your-token"
[System.Environment]::SetEnvironmentVariable('FIGMA_ACCESS_TOKEN', 'your-token', 'User')
```

### Step 3: Copy Configuration

**For Claude Code:**
Create `.copilot/mcp.json` with:
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

**For VS Code:**
Create `.vscode/mcp.json` with:
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

### Step 4: Restart
Restart VS Code or Claude Code

### Step 5: Test
Ask your AI: "What tools do you have access to?"

## Common Commands

### Verify Token is Set
```bash
echo $FIGMA_ACCESS_TOKEN  # macOS/Linux
$env:FIGMA_ACCESS_TOKEN   # Windows
```

### Test MCP Server Manually
```bash
npx -y @figma/mcp-server-figma
```

### Check Node Version
```bash
node --version  # Should be 20+
```

## Example Queries

Once configured, try these:

- "List all components in this Figma file"
- "What colors are used in this design?"
- "Show me the text styles from Figma"
- "Extract design tokens from this file"

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Token not found | Verify `echo $FIGMA_ACCESS_TOKEN` shows your token |
| Permission error | Check token has access to the Figma file |
| Server won't start | Run `node --version` (need 20+) |
| Wrong config format | Claude Code uses `mcpServers`, VS Code uses `servers` |

## Next Steps

- See [README.md](README.md) for full documentation
- See [MULTI_SERVER_SETUP.md](MULTI_SERVER_SETUP.md) for GitHub + Filesystem setup
- Try the example configurations in this directory

## Resources

- [MCP Documentation](https://modelcontextprotocol.io/)
- [Figma MCP Server](https://github.com/figma/mcp-server-figma)
- [MCP Server Registry](https://github.com/modelcontextprotocol/servers)

---

**Need Help?** Check the [full README](README.md) for detailed instructions and troubleshooting.
