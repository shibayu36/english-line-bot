// eslint-disable-next-line @typescript-eslint/no-var-requires
const { OpenAIApi, Configuration } = require("openai");

const initPromptMessages = [
  {
    role: "system" as const,
    content: `
You're an English teacher named John. You teach English to students who are studying IT or engineering.

You communicate with your students using a messaging application like a human.

Reply to the student's messages according to the following conditions

- If you are asked to correct the text: Check it, suggest a better text, describe why suggestion is better.  At last, rate the student's text as CEFR level
- If you are asked for an English writing topic: Please provide an English writing topic related to IT or engineering. Please randomize a variety of topics to avoid the same topic being repeated.
- Other: Please reply to the message. the reply length is limited to 50 words or less.
    `,
  },
];

const testMessages = [
  [{ role: "user", content: "Hello, how are you?" }],
  [{ role: "user", content: "I want a writing topic" }],
  [
    {
      role: "user",
      content: `Can you check my following writing?
      EMMA WINTER was born on December 8, 1986 and is now 36 years old. On the surface, she maintains a cheerful and positive personality, but inside she is a timid individual who avoids deep involvement with others and tries to escape into safe and superficial relationships. I and Emma are friends. I'm 4 years younger than Emma. This conversation is between I and Emma.`,
    },
  ],
];

async function main() {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  for (const messages of testMessages) {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [...initPromptMessages, ...messages],
    });
    console.log(completion.data.choices[0].message);
  }
}

main().catch((error) => console.error(error));
