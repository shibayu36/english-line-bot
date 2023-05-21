import { Conversation } from "./tables";

export type OpenAiApiResponse = {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Choice[];
  usage: Usage;
};

type Choice = {
  message: {
    role: string;
    content: string;
  };
  index: number;
  logprobs: null;
  finish_reason: string;
};

type Usage = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
};

export class OpenAI {
  private readonly headers: Record<string, string>;
  private readonly baseUrl = "https://api.openai.com";
  private readonly promptBase = `EMMA WINTER was born on December 8, 1986 and is now 36 years old. On the surface, she maintains a cheerful and positive personality, but inside she is a timid individual who avoids deep involvement with others and tries to escape into safe and superficial relationships. I and Emma are friends. I'm 4 years younger than Emma. This conversation is between I and Emma.\n\n`;

  constructor(apiKey: string) {
    this.headers = {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    };
  }

  public async generateMessage(records: Conversation[], message: string): Promise<string | undefined> {
    const dialog = records.reverse().map((record) => {
      return `I: ${record.my_message}\nEmma: ${record.bot_message}\n`;
    });
    dialog.push(`I: ${message}\nEmma:`);
    const prompt = `${this.promptBase}${dialog.join("")}`;
    const data = JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 15,
      temperature: 0.9,
      stop: "\n",
    });
    const apiResp = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: this.headers,
      body: data,
    })
      .then((res): Promise<OpenAiApiResponse> => res.json())
      .catch((err) => {
        console.log(`OpenAI API error: ${err}`);
        return null;
      });
    console.log(`apiResp: ${JSON.stringify(apiResp)}`);
    if (!apiResp) return "";

    console.log(apiResp);

    return apiResp.choices.map((choice) => choice.message.content.trim())[0];
  }
}
