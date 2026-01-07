# Discord Interactions Endpoint vs. Gateway for RPB Bot

## Verdict: DO NOT Configure the Interactions Endpoint URL

**Why?**
The RPB Bot is built using the **Sapphire Framework** (`SapphireClient`), which relies on a persistent **WebSocket Gateway** connection to function.

*   **Current Architecture:** The bot stays online (`client.login()`) and listens for events (messages, commands, member joins) in real-time via the Gateway.
*   **Interactions Endpoint:** This is for "serverless" bots (HTTP-only) that don't maintain a connection.
*   **Conflict:** If you enter a URL in the "Interactions Endpoint URL" field on the Discord Developer Portal, Discord stops sending interaction events (like Slash Commands) to the Gateway. **This would break your bot.**

## Configuration Checklist

Go to the [Discord Developer Portal](https://discord.com/developers/applications) > **General Information**:

1.  **Interactions Endpoint URL**: **LEAVE EMPTY**.
2.  **Linked Roles Verification URL**: Leave empty (unless you implement this specifically).
3.  **Terms of Service URL**: Optional (can link to `/privacy` on your site).
4.  **Privacy Policy URL**: Highly recommended (link to `https://rpbey.fr/privacy`).

## What if I want to use HTTP Interactions later?
If you ever migrate to a serverless architecture (e.g., Vercel Functions only, without a running Node.js process), you would then configure this URL. But for now, with `rpb-bot` running as a service, keep it empty.
