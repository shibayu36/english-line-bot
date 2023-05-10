import { Hono } from "hono";

const app = new Hono();

app.get("*", (c) => c.text("Hello World!"));

app.post("/api/webhook", async (c) => {
  console.log(JSON.stringify(c));
  return c.json({ message: "Hello World!" });
});

export default app;
