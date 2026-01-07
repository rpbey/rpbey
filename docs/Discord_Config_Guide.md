# Discord Developer Portal Configuration for RPB

Follow these steps to correctly configure your Discord Application for the RPB Dashboard and Bot.

## 1. Application & Bot Setup
1.  Go to the **[Discord Developer Portal](https://discord.com/developers/applications)**.
2.  Select your application (or create a new one named "RPB Bot").
3.  **Client ID & Secret**:
    *   Go to **OAuth2 > General**.
    *   Copy the **Client ID** and **Client Secret**.
    *   Update your `.env` file:
        ```env
        DISCORD_CLIENT_ID="your_client_id"
        DISCORD_CLIENT_SECRET="your_client_secret"
        ```

## 2. OAuth2 Redirects (Critical)
This allows users to log in to the dashboard via Discord.

1.  Go to **OAuth2 > General**.
2.  Find the **"Redirects"** section.
3.  Add the following URLs (replace `https://rpbey.fr` with your actual production domain if different, and keep localhost for dev):
    *   `http://localhost:3000/api/auth/callback/discord` (For local development)
    *   `https://rpbey.fr/api/auth/callback/discord` (For production)
4.  **Save Changes**.

## 3. Bot Token & Privileged Intents
1.  Go to the **Bot** tab.
2.  **Token**: Click "Reset Token" to generate a new one if you don't have it.
    *   Update `.env`: `DISCORD_TOKEN="your_bot_token"`
3.  **Privileged Gateway Intents**:
    *   Enable **Presence Intent**.
    *   Enable **Server Members Intent**.
    *   Enable **Message Content Intent**.
    *   *Why?* The bot needs these to manage roles, see who is online, and read command messages.
4.  **Save Changes**.

## 4. Webhook Configuration (Twitch Notifications)
To receive Twitch "Live" notifications in a specific Discord channel:

1.  Open your Discord Server.
2.  Go to **Server Settings > Integrations > Webhooks**.
3.  Click **New Webhook**.
4.  Name it "RPB Twitch" and select the channel (e.g., `#annonces-lives`).
5.  **Copy Webhook URL**.
6.  *Note:* The RPB Dashboard currently uses a custom bot implementation for Twitch notifications rather than a raw webhook URL, but keeping this webhook handy is useful for debugging or fallback.

## 5. Invite the Bot
To add the bot to your server with the correct permissions:

1.  Go to **OAuth2 > URL Generator**.
2.  **Scopes**: Check `bot` and `applications.commands`.
3.  **Bot Permissions**: Check `Administrator` (easiest for dev) or select specific permissions:
    *   Manage Roles
    *   Manage Channels
    *   Kick/Ban Members
    *   Send Messages
    *   Manage Messages
4.  Copy the generated URL and open it in your browser to invite the bot.
