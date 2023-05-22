import { TextEventMessage, WebhookEvent } from "@line/bot-sdk";
import { Env, Hono } from "hono";
import { Line } from "./line";
import { OpenAI } from "./openai";
import { Conversation } from "./tables";

type QueueBody = {
  replyToken: string;
};

type Bindings = {
  DB: D1Database;
  QUEUE: Queue<QueueBody>;
  CHANNEL_ACCESS_TOKEN: string;
  OPENAI_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("*", (c) => c.text("Hello World!"));

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
  const { text: my_message } = event.message as TextEventMessage;

  c.env.QUEUE.send({ replyToken });
  return c.json({ message: "ok" });

  try {
    // Fetch 2 conversation from D1
    const { results } = await c.env.DB.prepare(
      `select * from conversations order by id desc limit 2`
    ).all<Conversation>();
    console.log(results);

    // Generate answer with OpenAI
    const openaiClient = new OpenAI(c.env.OPENAI_API_KEY);
    const generatedMessage = await openaiClient.generateMessage(results!, my_message);
    console.log(generatedMessage);
    if (!generatedMessage || generatedMessage === "") throw new Error("No message generated");

    // Save generated answer to D1
    await c.env.DB.prepare(`insert into conversations (my_message, bot_message) values (?, ?)`)
      .bind(my_message, generatedMessage)
      .run();

    // Reply to the user
    const lineClient = new Line(c.env.CHANNEL_ACCESS_TOKEN);
    await lineClient.replyMessage(generatedMessage, replyToken);
    return c.json({ message: "ok" });
  } catch (err: unknown) {
    if (err instanceof Error) console.error(err);
    const lineClient = new Line(c.env.CHANNEL_ACCESS_TOKEN);
    await lineClient.replyMessage("I am not feeling well right now.", replyToken);
    return c.json({ message: "ng" });
  }
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return app.fetch(request, env, ctx);
  },
  async queue(batch: MessageBatch<QueueBody>, env: Bindings): Promise<void> {
    let messages = JSON.stringify(batch.messages);
    console.log(`consumed from our queue: ${messages}`);
  },
};
