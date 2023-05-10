import { Hono } from "hono";
import { MessageAPIResponseBase, TextMessage, WebhookEvent } from "@line/bot-sdk";

const app = new Hono();

app.get("*", (c) => c.text("Hello World!"));

app.post("/api/webhook", async (c) => {
  const data = await c.req.json();
  const events: WebhookEvent[] = (data as any).events;
  const accessToken: string = (c.env?.CHANNEL_ACCESS_TOKEN ?? "") as string;

  await Promise.all(
    events.map(async (event) => {
      try {
        await textEventHandler(event, accessToken);
      } catch (error) {
        if (error instanceof Error) {
          console.error(error.message);
        }
        return c.json({
          status: "error",
        });
      }
    })
  );
  return c.json({ message: "ok" });
});

async function textEventHandler(event: WebhookEvent, accessToken: string): Promise<MessageAPIResponseBase | undefined> {
  if (event.type !== "message" || event.message.type !== "text") {
    return;
  }

  const { replyToken } = event;
  const { text } = event.message;
  const response = {
    type: "text",
    text,
  };
  await fetch("https://api.line.me/v2/bot/message/reply", {
    body: JSON.stringify({
      replyToken,
      messages: [response],
    }),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export default app;
