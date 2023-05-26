# english-line-bot
English teacher LINE bot, who chats with us, provides an English writing topic and corrects our writing.

## Requirement
- Cloudflare Workers Account
- LINE Developers Account

## How to Setup
### Prepare LINE Messaging API (WIP)
- Create a channel
- Disable auto reply and hello
- Get an access token

### Prepare secret values
.dev.vars
```
CHANNEL_ACCESS_TOKEN=...
OPENAI_API_KEY=...
```

### Change database_id in wrangler.toml
Change database_id in wrangler.toml

### Create resources
D1

- Create a database: `npm exec -- wrangler d1 create english-line-bot-db`
- Change database_id in wrangler.toml
- Apply schema.sql: `npm exec -- wrangler d1 execute english-line-bot-db --file=./schema.sql`

### Deploy
```
npm run deploy
```

### Customize
If you want to customize your bot character, change a prompt in src/prompt.ts and deploy.
