import { TextEventMessage, WebhookEvent } from "@line/bot-sdk";
import { Env, Hono } from "hono";
import { Line } from "./line";
import { OpenAI } from "./openai";
import { Conversation } from "./tables";

type QueueBody = {
  text: string;
  replyToken: string;
};

type Bindings = {
  DB: D1Database;
  QUEUE: Queue<QueueBody>;
  CHANNEL_ACCESS_TOKEN: string;
  OPENAI_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.post("/api/webhook", async (c) => {
  const data = await c.req.json();
  console.log(JSON.stringify(data));

  const events: WebhookEvent[] = (data as any).events;

  const event = events
    .map((event: WebhookEvent) => {
      if (event.type != "message" || event.message.type != "text") {
        return;
      }
      return event;
    })
    .filter((event) => event)[0];

  if (!event) {
    console.log(`No event: ${events}`);
    return c.json({ message: "ok" });
  }

  const { replyToken } = event;
  const { text } = event.message as TextEventMessage;

  await c.env.QUEUE.send({ text, replyToken });
  return c.json({ message: "ok" });
});

async function handleQueue(message: Message<QueueBody>, env: Bindings) {
  const { text, replyToken } = message.body;

  try {
    // Fetch 2 conversation from D1
    const { results } = await env.DB.prepare(
      `select * from conversations order by id desc limit 2`
    ).all<Conversation>();

    // Generate answer with OpenAI
    const openaiClient = new OpenAI(env.OPENAI_API_KEY);
    const generatedMessage = await openaiClient.generateMessage(results!, text);
    console.log(generatedMessage);
    if (!generatedMessage || generatedMessage === "") throw new Error("No message generated");

    // Save generated answer to D1
    await env.DB.prepare(`insert into conversations (my_message, bot_message) values (?, ?)`)
      .bind(text, generatedMessage)
      .run();

    // Reply to the user
    const lineClient = new Line(env.CHANNEL_ACCESS_TOKEN);
    await lineClient.replyMessage(generatedMessage, replyToken);
  } catch (err: unknown) {
    if (err instanceof Error) console.error(err);
    const lineClient = new Line(env.CHANNEL_ACCESS_TOKEN);
    await lineClient.replyMessage("I am not feeling well right now.", replyToken);
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return app.fetch(request, env, ctx);
  },
  async queue(batch: MessageBatch<QueueBody>, env: Bindings): Promise<void> {
    for (const message of batch.messages) {
      await handleQueue(message, env);
    }
  },
};
