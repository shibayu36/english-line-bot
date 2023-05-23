import { Conversation } from "./tables";
import { initPromptMessages } from "./prompt";
import type { ChatCompletionRequestMessage, CreateChatCompletionResponse } from "openai";
export class OpenAI {
  private readonly headers: Record<string, string>;
  private readonly baseUrl = "https://api.openai.com";

  constructor(apiKey: string) {
    this.headers = {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    };
  }

  public async generateMessage(records: Conversation[], message: string): Promise<string | undefined> {
    const messages: Array<ChatCompletionRequestMessage> = [...initPromptMessages];
    for (const record of records.reverse()) {
      messages.push({ role: "user", content: record.my_message });
      messages.push({ role: "assistant", content: record.bot_message });
    }
    messages.push({ role: "user", content: message });

    const data = JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: messages,
      temperature: 0.9,
    });
    const apiResp = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: this.headers,
      body: data,
    })
      .then((res): Promise<CreateChatCompletionResponse> => res.json())
      .catch((err) => {
        console.log(`OpenAI API error: ${err}`);
        return null;
      });

    return apiResp?.choices[0].message?.content;
  }
}
