# BROWSER_MCP_SETUP

## Purpose

Register a browser MCP server for local UI review and interactive verification.

## PM decision

Use Playwright MCP as the browser automation server.

Why:

- it is the most standard MCP option for browser automation right now
- it can run a local headed browser so the operator can watch UI changes
- it fits our current DAMIT workflow of UI review and self-host verification

## Configuration target

Codex user config:

- `C:\Users\jihoo\.codex\config.toml`

## Recommended server

- package: `@playwright/mcp`
- launch mode: headed browser
- browser: `msedge`

## Recommended config shape

```toml
[mcp_servers.playwright]
command = "npx"
args = ["-y", "@playwright/mcp@latest", "--browser", "msedge"]
```

## PM notes

- headed mode is intentional because the user wants to watch changes in a real browser
- after changing Codex MCP config, Codex restart is required before the MCP tools appear in-session
- installation may download Playwright browser support the first time it runs

## Verification steps

1. update Codex config
2. restart Codex desktop
3. verify the Playwright MCP server appears as an MCP server in the next session
4. use the browser MCP for local DAMIT UI review

## Fallback

Until the restarted session picks up the MCP tools, keep using the existing local browser review flow:

- run the app locally
- open the page in the local browser
- use our visual review scripts for regression checks
