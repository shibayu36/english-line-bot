import { TextEventMessage, WebhookEvent } from "@line/bot-sdk";
import { Hono } from "hono";
import { Line } from "./line";
import { OpenAI } from "./openai";
import { Conversation } from "./tables";

type Bindings = {
  DB: D1Database;
  CHANNEL_ACCESS_TOKEN: string;
  OPENAI_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.post("/api/webhook", async (c) => {
  const data = await c.req.json();

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

  c.executionCtx.waitUntil(replyGeneratedMessage(c.env, text, replyToken));

  return c.json({ message: "ok" });
});

app.post("/api/generate_message", async (c) => {
  const { text } = await c.req.json();
  const generatedMessage = await generateMessageAndSaveHistory(text, c.env);
  return c.json({ message: generatedMessage });
});

async function replyGeneratedMessage(env: Bindings, text: string, replyToken: string) {
  try {
    const generatedMessage = await generateMessageAndSaveHistory(text, env);
    console.log(generatedMessage);

    // Reply to the user
    const lineClient = new Line(env.CHANNEL_ACCESS_TOKEN);
    await lineClient.replyMessage(generatedMessage, replyToken);
  } catch (err: unknown) {
    if (err instanceof Error) console.error(err);
    const lineClient = new Line(env.CHANNEL_ACCESS_TOKEN);
    await lineClient.replyMessage("I am not feeling well right now.", replyToken);
  }
}

async function generateMessageAndSaveHistory(text: string, env: Bindings) {
  // Fetch 2 conversation from D1
  const { results } = await env.DB.prepare(`select * from conversations order by id desc limit 15`).all<Conversation>();

  // Generate answer with OpenAI
  const openaiClient = new OpenAI(env.OPENAI_API_KEY);
  const generatedMessage = await openaiClient.generateMessage(results!, text);
  if (!generatedMessage || generatedMessage === "") throw new Error("No message generated");

  // Save generated answer to D1
  await env.DB.prepare(`insert into conversations (message, role) values (?, 'user')`).bind(text).run();
  await env.DB.prepare(`insert into conversations (message, role) values (?, 'assistant')`)
    .bind(generatedMessage)
    .run();

  return generatedMessage;
}

export default app;
