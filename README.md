# english-line-bot
English teacher LINE bot, who chats with us, provides an English writing topic and corrects our writing.

## Requirement
- Cloudflare's Workers Paid Plan to use Queues

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

Queues
```
npm exec -- wrangler queues create english-line-bot-queue
```

### Deploy
```
npm run deploy
```
